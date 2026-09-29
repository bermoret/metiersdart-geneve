/**
 * Rapatrie sur Vercel Blob les images (et PDF) encore servies par l'ancien site
 * Joomla (metiersdart-geneve.ch / www.), avant son arrêt.
 *
 * Colonnes migrées (hôte de l'ancien site uniquement) :
 *   artisans.image_url, actualites.image_url, partenaires.logo_url → image
 *   manufacto_editions.media_url → image ou PDF
 *   medias.pdf_url → PDF (revues de presse)
 * Les autres colonnes qui pointent vers l'ancien site (liens, galeries JEMA en
 * jsonb, pages statiques…) sont seulement comptées : à traiter à part.
 *
 * Types acceptés, contrôle des URL et des redirections, store Blob, noms
 * stables : scripts/lib/joomla-blob.ts (socle partagé avec sync-actu-medias.ts).
 * Une redirection vers un AUTRE chemin est un échec, sauf avec --allow-redirects.
 *
 * À blanc : liste par colonne (nombre + échantillon), vérifie chaque URL (HEAD,
 * repli GET ; 4 en parallèle), signale échecs et redirections. N'écrit rien.
 *
 * --apply --backup <fichier.json> :
 *   1. sauvegarde {table, column, id, key, oldUrl, blobBase} de chaque ligne
 *      visée (fichier neuf : refus s'il existe déjà) — AVANT toute écriture ;
 *   2. télécharge chaque fichier (200 + type accepté exigés) et l'envoie sur
 *      Blob sous un nom stable `migration-joomla/<table>/<slug-ou-id>-<nom>.<ext>`
 *      (pas de suffixe aléatoire, écrasement permis : relancer réécrit le même
 *      fichier, sans doublon) ;
 *   3. une seule transaction à la fin : UPDATE … WHERE id = $1 AND <col> = <ancienne URL>
 *      (une valeur modifiée entre-temps dans l'admin n'est jamais écrasée) ;
 *   4. après le COMMIT, écrit `<fichier>.applied.json` : {table, column, id,
 *      oldUrl, newUrl} des lignes RÉELLEMENT modifiées (base du retour arrière).
 * Une ligne dont le téléchargement ou l'envoi échoue est ignorée et signalée :
 * elle garde l'ancienne URL, et la relance suivante la reprend (les autres ne
 * sont plus visées). Un fichier Joomla mort ne bloque donc pas les 143 autres.
 * Après succès complet, une relance ne trouve plus rien à faire.
 *
 * updated_at n'est pas modifié : même image, autre adresse. Les pages en cache
 * (ISR, 60 s à 1 h) servent l'ancienne URL jusqu'à leur régénération : garder
 * l'ancien site en ligne au moins une heure après --apply.
 *
 * Retour arrière (à partir du fichier .applied.json, jamais de la sauvegarde) :
 *   UPDATE <table> SET <column> = <oldUrl> WHERE id = <id> AND <column> = <newUrl>
 * ce que fait --rollback (à blanc sans --apply ; les fichiers Blob restent).
 *
 * Usage :
 *   npx tsx scripts/migrate-images-to-blob.ts                                  → à blanc
 *   npx tsx scripts/migrate-images-to-blob.ts --apply --backup <f.json> [--store <id>] [--allow-redirects]
 *   npx tsx scripts/migrate-images-to-blob.ts --rollback <f.applied.json> [--apply]
 * Base : endpoint direct de Neon (scripts/lib/db-script.ts) ; Blob : BLOB_READ_WRITE_TOKEN
 * (.env.local, lu si DATABASE_URL absent).
 */
import { existsSync, writeFileSync } from "node:fs";
import type { Client } from "pg";
import {
  apply,
  argValue,
  rollbackApplied,
  runMain,
  transaction,
  withClient,
  type AppliedRow,
} from "./lib/db-script";
import {
  CONCURRENCY,
  OLD_HOST_ANYWHERE_SQL,
  OLD_HOST_SQL,
  blobStem,
  checkOldSiteUrl,
  checkStore,
  errMsg,
  existingStores,
  formatBytes,
  mapLimit,
  redirectTag,
  safeSegment,
  storeIdOf,
  uploadFromOldSite,
  type Kind,
  type Outcome,
} from "./lib/joomla-blob";

interface Target {
  table: string;
  column: string;
  /** Colonne qui nomme le fichier sur Blob (slug si stable et lisible, sinon id). */
  key: "slug" | "id";
  accept: Kind[];
}

const TARGETS: Target[] = [
  { table: "artisans", column: "image_url", key: "slug", accept: ["image"] },
  { table: "actualites", column: "image_url", key: "id", accept: ["image"] },
  { table: "partenaires", column: "logo_url", key: "id", accept: ["image"] },
  { table: "manufacto_editions", column: "media_url", key: "id", accept: ["image", "pdf"] },
  { table: "medias", column: "pdf_url", key: "id", accept: ["pdf"] },
];

/** Colonnes où chercher des URL Blob existantes (store déjà utilisé), en plus des cibles. */
const BLOB_SCAN_EXTRA = [
  { table: "artisans", column: "gallery_images" },
  { table: "jema_editions", column: "gallery_images" },
  { table: "jema_editions", column: "program_url" },
];

const fetchOptions = { allowRedirects: process.argv.includes("--allow-redirects") };

interface Row {
  target: Target;
  id: string;
  key: string;
  oldUrl: string;
  /** Nom Blob sans extension (l'extension dépend du type reçu). */
  blobBase: string;
}

function blobBase(t: Target, key: string, oldUrl: string): string {
  return `migration-joomla/${t.table}/${safeSegment(key)}-${blobStem(oldUrl)}`;
}

// ─── Lecture ────────────────────────────────────────────────────

async function readRows(client: Client): Promise<Row[]> {
  const rows: Row[] = [];
  for (const t of TARGETS) {
    const tbl = client.escapeIdentifier(t.table);
    const col = client.escapeIdentifier(t.column);
    const key = client.escapeIdentifier(t.key);
    const res = await client.query<{ id: string; key: string; url: string }>(
      `SELECT id::text AS id, ${key}::text AS key, ${col} AS url FROM ${tbl}
        WHERE ${col} ~* $1 ORDER BY ${key}`,
      [OLD_HOST_SQL],
    );
    for (const r of res.rows) {
      rows.push({ target: t, id: r.id, key: r.key, oldUrl: r.url, blobBase: blobBase(t, r.key, r.url.trim()) });
    }
  }
  return rows;
}

/** Autres colonnes texte / jsonb qui mentionnent une URL de l'ancien site (comptage seul). */
async function otherColumns(client: Client): Promise<{ where: string; count: number }[]> {
  const { rows: cols } = await client.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND data_type IN ('text', 'character varying', 'jsonb', 'json')
      ORDER BY table_name, column_name`,
  );
  const found: { where: string; count: number }[] = [];
  for (const c of cols) {
    if (TARGETS.some((t) => t.table === c.table_name && t.column === c.column_name)) continue;
    const { rows } = await client.query<{ n: string }>(
      `SELECT count(*) AS n FROM ${client.escapeIdentifier(c.table_name)}
        WHERE ${client.escapeIdentifier(c.column_name)}::text ~* $1`,
      [OLD_HOST_ANYWHERE_SQL],
    );
    const n = Number(rows[0].n);
    if (n > 0) found.push({ where: `${c.table_name}.${c.column_name}`, count: n });
  }
  return found;
}

function report(rows: Row[], others: { where: string; count: number }[]) {
  for (const t of TARGETS) {
    const mine = rows.filter((r) => r.target === t);
    console.log(`\n${t.table}.${t.column} : ${mine.length} URL(s) sur l'ancien site`);
    for (const r of mine.slice(0, 5)) console.log(`  ${r.key} — ${r.oldUrl}`);
    if (mine.length > 5) console.log(`  … et ${mine.length - 5} autre(s)`);
  }
  if (others.length) {
    console.log("\nAutres colonnes pointant vers l'ancien site (NON migrées, à traiter à part) :");
    for (const o of others) console.log(`  ${o.where} : ${o.count} ligne(s)`);
  } else {
    console.log("\nAucune autre colonne ne pointe vers l'ancien site.");
  }
}

function reportRedirects(rows: Row[], outcomes: Outcome[]) {
  const redirected = rows.map((r, i) => ({ r, o: outcomes[i] })).filter(({ o }) => o.redirect);
  if (!redirected.length) return;
  console.log(`\nRedirections (${redirected.length}) :`);
  for (const { r, o } of redirected) {
    const d = o.redirect!;
    console.log(`  [${redirectTag(d, fetchOptions)}] ${r.target.table} ${r.key} — ${d.from} → ${d.to}`);
  }
}

// ─── Programme ──────────────────────────────────────────────────

async function main() {
  const rollbackPath = argValue("--rollback");
  if (process.argv.includes("--rollback")) {
    if (!rollbackPath) {
      console.error("--rollback exige un fichier <…>.applied.json : rien fait.");
      process.exit(1);
    }
    await rollbackApplied(rollbackPath, TARGETS);
    return;
  }

  const backupPath = argValue("--backup");
  const appliedPath = backupPath && `${backupPath.replace(/\.json$/i, "")}.applied.json`;
  if (apply) {
    if (!backupPath || !appliedPath) {
      console.error("--apply exige --backup <fichier.json> (sauvegarde des anciennes URL) : rien fait.");
      process.exit(1);
    }
    for (const f of [backupPath, appliedPath]) {
      if (existsSync(f)) {
        console.error(`${f} existe déjà : choisir un nouveau fichier (jamais écrasé). Rien fait.`);
        process.exit(1);
      }
    }
  }

  // 1. Lecture seule, connexion refermée avant le réseau (plusieurs minutes).
  const { rows, others, stores } = await withClient((client) =>
    transaction(client, { write: false }, async (c) => ({
      rows: await readRows(c),
      others: await otherColumns(c),
      stores: await existingStores(c, [...TARGETS, ...BLOB_SCAN_EXTRA]),
    })),
  );
  report(rows, others);

  // Deux lignes vers le même nom Blob s'écraseraient : impossible (slug / id
  // uniques par table), mais vérifié plutôt que supposé.
  const seen = new Map<string, Row>();
  for (const r of rows) {
    const prev = seen.get(r.blobBase);
    if (prev && prev.oldUrl !== r.oldUrl) {
      throw new Error(`Nom Blob en double : ${r.blobBase} (${prev.target.table} ${prev.id} / ${r.target.table} ${r.id})`);
    }
    seen.set(r.blobBase, r);
  }

  // .env.local est chargé par withClient : jeton lisible seulement maintenant.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = storeIdOf(token);
  const storeError = checkStore(storeId, stores, argValue("--store"));

  if (rows.length === 0) {
    console.log("\nRien à migrer.");
    return;
  }

  if (!apply) {
    console.log(`\nVérification de ${rows.length} URL(s)…`);
    const checks = await mapLimit(rows, CONCURRENCY, (r) => checkOldSiteUrl(r.oldUrl, r.target.accept, fetchOptions));
    const failed = rows.map((r, i) => ({ r, c: checks[i] })).filter(({ c }) => c.error);
    const bytes = checks.reduce((s, c) => s + c.bytes, 0);
    for (const { r, c } of failed) console.log(`  ÉCHEC ${r.target.table} ${r.key} — ${c.error} — ${r.oldUrl}`);
    reportRedirects(rows, checks);
    const redirected = checks.filter((c) => c.redirect).length;
    console.log(
      `\nÀ blanc : ${rows.length - failed.length} fichier(s) migrable(s) (~${formatBytes(bytes)}), ` +
        `${failed.length} en échec${redirected ? `, ${redirected} redirigé(s)` : ""}.`,
    );
    console.log(`Exemple de nom Blob : ${rows[0].blobBase}.<ext du type reçu>`);
    console.log(storeError ? `--apply serait refusé : ${storeError}.` : "Store Blob : OK pour --apply.");
    console.log("Relancer avec --apply --backup <fichier.json> [--store <storeId>] pour migrer.");
    return;
  }

  if (storeError || !token || !storeId) {
    console.error(`Store Blob : ${storeError ?? "jeton absent"}. Rien fait.`);
    process.exit(1);
  }

  // 2. Sauvegarde AVANT toute écriture (Blob compris) ; 'wx' : jamais d'écrasement.
  const backup = rows.map((r) => ({
    table: r.target.table,
    column: r.target.column,
    id: r.id,
    key: r.key,
    oldUrl: r.oldUrl,
    blobBase: r.blobBase,
  }));
  writeFileSync(backupPath!, JSON.stringify({ createdAt: new Date().toISOString(), storeId, rows: backup }, null, 2), {
    flag: "wx",
  });
  console.log(`\nSauvegarde : ${backup.length} ligne(s) dans ${backupPath}`);

  // 3. Téléchargements et envois.
  console.log(`Migration de ${rows.length} fichier(s)…`);
  let done = 0;
  const outcomes = await mapLimit(rows, CONCURRENCY, async (r) => {
    const o = await uploadFromOldSite({ oldUrl: r.oldUrl, blobBase: r.blobBase, accept: r.target.accept }, token, storeId, fetchOptions);
    if (!o.error && ++done % 20 === 0) console.log(`  ${done}/${rows.length}`);
    return o;
  });
  const results = rows.map((r, i) => ({ r, ...outcomes[i] }));
  const uploaded = results.filter((x): x is typeof x & { url: string } => x.url !== null);
  const failed = results.filter((x) => x.error !== null);
  for (const f of failed) console.log(`  ÉCHEC ${f.r.target.table} ${f.r.key} — ${f.error} — ${f.r.oldUrl}`);
  reportRedirects(rows, outcomes);
  console.log(
    `Envoyés sur Blob : ${uploaded.length} (${formatBytes(uploaded.reduce((s, x) => s + x.bytes, 0))}), en échec : ${failed.length}.`,
  );

  // 4. Une transaction pour toutes les URL ; une valeur changée entre-temps
  //    n'est pas écrasée (le fichier Blob correspondant reste orphelin, signalé).
  if (uploaded.length) {
    const { applied, kept } = await withClient((client) =>
      transaction(client, { write: true, lockTimeout: "5s" }, async (c) => {
        const applied: AppliedRow[] = [];
        const kept: typeof uploaded = [];
        for (const x of uploaded) {
          const t = x.r.target;
          const col = c.escapeIdentifier(t.column);
          const res = await c.query(
            `UPDATE ${c.escapeIdentifier(t.table)} SET ${col} = $3 WHERE id = $1 AND ${col} = $2`,
            [x.r.id, x.r.oldUrl, x.url],
          );
          if (res.rowCount === 1) {
            applied.push({ table: t.table, column: t.column, id: x.r.id, oldUrl: x.r.oldUrl, newUrl: x.url });
          } else {
            kept.push(x);
          }
        }
        return { applied, kept };
      }),
    );
    // Transaction validée : la suite n'est qu'un compte rendu.
    const appliedJson = JSON.stringify({ createdAt: new Date().toISOString(), storeId, rows: applied }, null, 2);
    try {
      writeFileSync(appliedPath!, appliedJson, { flag: "wx" });
      console.log(`\nLignes modifiées (base du retour arrière) : ${applied.length} dans ${appliedPath}`);
    } catch (err) {
      console.error(`\nÉcriture de ${appliedPath} impossible (${errMsg(err)}) : contenu à conserver ci-dessous.`);
      console.log(appliedJson);
    }
    for (const x of kept) {
      console.log(`  inchangée (modifiée entre-temps) : ${x.r.target.table} ${x.r.key} — Blob orphelin ${x.url}`);
    }
    console.log(`Base mise à jour : ${applied.length} ligne(s), ${kept.length} inchangée(s).`);
  }

  if (failed.length) {
    console.log(`\nMigration partielle : ${failed.length} ligne(s) restée(s) sur l'ancien site. Relancer pour les reprendre.`);
    process.exitCode = 1;
  } else {
    console.log("\nMigration terminée. Une relance à blanc doit afficher « Rien à migrer » pour ces colonnes.");
  }
}

runMain(main);
