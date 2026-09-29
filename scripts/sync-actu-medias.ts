/**
 * Aligne les tables actualites et medias sur le contenu de référence des pages
 * /l-actu et /medias (src/lib/actu-medias-static.ts : ce que les pages
 * affichaient en dur le 29.09.2026), avant que l'admin devienne la source.
 *
 * Plan (src/lib/actu-medias-sync.ts, testé) : rapprochement par titre
 * (actualités), identifiant vidéo / année de revue / titre (médias) ; mise à
 * jour des colonnes qui diffèrent, insertion des lignes absentes, DÉPUBLICATION
 * (published = false) des lignes que la page n'affiche plus — jamais de
 * suppression. Fichiers encore sur l'ancien site Joomla : copiés sur Vercel
 * Blob (scripts/lib/joomla-blob.ts, mêmes règles que migrate-images-to-blob.ts)
 * et la colonne reçoit l'URL Blob ; une valeur déjà sur Blob est gardée.
 *
 * Prérequis : scripts/migrate-actu-medias.ts --apply (colonnes source, subtitle,
 * time_label, link_label, medias.published) — vérifié, sinon abandon.
 *
 * À blanc (sans --apply) : lecture seule, affiche le plan complet et vérifie
 * (HEAD) chaque fichier à téléverser. N'écrit rien, ni en base ni sur Blob.
 *
 * --apply --backup <fichier.json> :
 *   1. sauvegarde l'état AVANT (lignes complètes des deux tables) dans le
 *      fichier (neuf : refus s'il existe déjà) ;
 *   2. téléverse les fichiers (nom stable `migration-joomla/<table>/<id>-<nom>.<ext>`) ;
 *      un envoi qui échoue laisse la colonne inchangée, signalé, code de sortie 1 ;
 *   3. une seule transaction : UPDATE / INSERT / dépublication ; chaque UPDATE
 *      est gardé par l'empreinte de la ligne lue au moment du plan (md5 de la
 *      ligne entière) : une ligne modifiée entre-temps (admin, pendant les
 *      envois Blob) n'est jamais écrasée — la transaction entière est annulée ;
 *   4. après le COMMIT, écrit `<fichier>.applied.json` (changements appliqués,
 *      colonne par colonne, avec l'ancienne valeur) pour un retour arrière manuel.
 *
 * Usage :
 *   npx tsx scripts/sync-actu-medias.ts                                → à blanc
 *   npx tsx scripts/sync-actu-medias.ts --apply --backup <f.json> [--store <id>] [--allow-redirects]
 * Base : endpoint direct de Neon (scripts/lib/db-script.ts) ; Blob : BLOB_READ_WRITE_TOKEN
 * (.env.local, lu si DATABASE_URL absent).
 */
import { existsSync, writeFileSync } from "node:fs";
import type { Client } from "pg";
import { apply, argValue, runMain, transaction, withClient } from "./lib/db-script";
import {
  CONCURRENCY,
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
  type Outcome,
} from "./lib/joomla-blob";
import { staticActualites, staticMedias } from "../src/lib/actu-medias-static";
import {
  describePlan,
  planActualites,
  planMedias,
  type ActuRow,
  type MediaRow,
  type SqlValue,
  type TablePlan,
  type Upload,
} from "../src/lib/actu-medias-sync";

const REQUIRED_COLUMNS = [
  { table: "actualites", column: "source" },
  { table: "actualites", column: "subtitle" },
  { table: "actualites", column: "time_label" },
  { table: "actualites", column: "link_label" },
  { table: "medias", column: "published" },
];

/** Colonnes d'URL où chercher les stores Blob déjà utilisés. */
const BLOB_COLUMNS = [
  { table: "actualites", column: "image_url" },
  { table: "medias", column: "pdf_url" },
  { table: "medias", column: "external_url" },
  { table: "artisans", column: "image_url" },
];

const fetchOptions = { allowRedirects: process.argv.includes("--allow-redirects") };

// ─── Lecture ────────────────────────────────────────────────────

/**
 * Colonnes de la migration absentes de la base. À blanc, on lit quand même
 * (colonne absente = NULL, medias.published = true) pour montrer le plan ;
 * --apply est refusé tant qu'elles manquent.
 */
async function missingColumns(client: Client): Promise<Set<string>> {
  const missing = new Set<string>();
  for (const c of REQUIRED_COLUMNS) {
    const { rows } = await client.query(
      `SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass($1) AND attname = $2 AND NOT attisdropped`,
      [c.table, c.column],
    );
    if (rows.length === 0) missing.add(`${c.table}.${c.column}`);
  }
  return missing;
}

/** `colonne AS "alias"`, ou `<défaut> AS "alias"` si la colonne n'existe pas encore. */
const col = (missing: Set<string>, table: string, column: string, alias: string, fallback = "NULL") =>
  `${missing.has(`${table}.${column}`) ? fallback : column} AS "${alias}"`;

async function readActualites(client: Client, missing: Set<string>): Promise<ActuRow[]> {
  const c = (column: string, alias: string) => col(missing, "actualites", column, alias);
  const { rows } = await client.query<ActuRow>(
    `SELECT id::text AS id, title, category, ${c("source", "source")}, ${c("subtitle", "subtitle")}, excerpt,
            event_date AS "eventDate", event_end_date AS "eventEndDate", ${c("time_label", "timeLabel")},
            link_url AS "linkUrl", ${c("link_label", "linkLabel")}, image_url AS "imageUrl",
            published, is_archived AS "isArchived"
       FROM actualites ORDER BY created_at, id`,
  );
  return rows;
}

async function readMedias(client: Client, missing: Set<string>): Promise<MediaRow[]> {
  const { rows } = await client.query<MediaRow>(
    `SELECT id::text AS id, title, type, media_type AS "mediaType", video_url AS "videoUrl",
            external_url AS "externalUrl", pdf_url AS "pdfUrl", date, source,
            sort_order AS "sortOrder", ${col(missing, "medias", "published", "published", "true")}
       FROM medias ORDER BY sort_order, created_at, id`,
  );
  return rows;
}

/**
 * Empreinte de chaque ligne (md5 de la ligne entière, texte) lue avec le plan :
 * garde optimiste des UPDATE (medias n'a pas de updated_at, et les valeurs
 * « avant » du plan sont normalisées, donc incomparables telles quelles).
 */
async function readVersions(client: Client, table: Upload["table"]): Promise<Map<string, string>> {
  const tbl = client.escapeIdentifier(table);
  const { rows } = await client.query<{ id: string; version: string }>(
    `SELECT id::text AS id, md5(${tbl}::text) AS version FROM ${tbl}`,
  );
  return new Map(rows.map((r) => [r.id, r.version]));
}

/** Ligne complète (sauvegarde) : toutes les colonnes, sans transformation. */
async function snapshot(client: Client, table: "actualites" | "medias", ids: string[]): Promise<Record<string, unknown>[]> {
  if (ids.length === 0) return [];
  const { rows } = await client.query(`SELECT * FROM ${client.escapeIdentifier(table)} WHERE id = ANY($1::uuid[])`, [ids]);
  return rows;
}

// ─── Téléversements ─────────────────────────────────────────────

type Job = Upload & { blobBase: string };

function jobs(plans: Record<Upload["table"], TablePlan>): Job[] {
  const out: Job[] = [];
  for (const [table, plan] of Object.entries(plans) as [Upload["table"], TablePlan][]) {
    for (const u of plan.uploads) {
      const key = u.id ?? safeSegment(plan.inserts[u.insert ?? 0].title.toLowerCase());
      out.push({ ...u, blobBase: `migration-joomla/${table}/${safeSegment(key)}-${blobStem(u.oldUrl)}` });
    }
  }
  return out;
}

function reportOutcomes(list: Job[], outcomes: Outcome[], verb: string) {
  const failed = list.map((j, i) => ({ j, o: outcomes[i] })).filter(({ o }) => o.error);
  for (const { j, o } of failed) console.log(`  ÉCHEC ${j.table} ${j.id ?? `insertion #${(j.insert ?? 0) + 1}`} — ${o.error} — ${j.oldUrl}`);
  const redirected = list.map((j, i) => ({ j, o: outcomes[i] })).filter(({ o }) => o.redirect);
  for (const { j, o } of redirected) {
    console.log(`  [${redirectTag(o.redirect!, fetchOptions)}] ${j.table} ${j.oldUrl} → ${o.redirect!.to}`);
  }
  const bytes = outcomes.reduce((s, o) => s + o.bytes, 0);
  console.log(`${verb} : ${list.length - failed.length} fichier(s) (~${formatBytes(bytes)}), ${failed.length} en échec.`);
  return failed.length;
}

// ─── Écriture ───────────────────────────────────────────────────

type Applied = { table: string; id: string; column: string; from: SqlValue; to: SqlValue };

/**
 * Applique un plan : une valeur d'URL téléversée remplace l'ancienne URL ; si
 * son envoi a échoué, la colonne n'est pas touchée (`blobUrls` sans entrée).
 * UPDATE gardé par l'empreinte lue avec le plan (`versions`) : 0 ligne touchée
 * → exception, donc ROLLBACK de toute la transaction.
 */
async function applyPlan(
  client: Client,
  table: Upload["table"],
  plan: TablePlan,
  blobUrls: Map<string, string>,
  versions: Map<string, string>,
  applied: Applied[],
) {
  const tbl = client.escapeIdentifier(table);
  const touch = table === "actualites" ? ", updated_at = now()" : "";
  const guarded = async (id: string, title: string, sets: string, params: SqlValue[]) => {
    const version = versions.get(id);
    if (!version) throw new Error(`${table} ${id} (« ${title} ») absente de la lecture du plan : rien écrit.`);
    params.push(version);
    const res = await client.query(
      `UPDATE ${tbl} SET ${sets}${touch} WHERE id = $1 AND md5(${tbl}::text) = $${params.length}`,
      params,
    );
    if (res.rowCount !== 1) {
      throw new Error(
        `${table} ${id} (« ${title} ») modifiée ou supprimée depuis la lecture du plan : ` +
          "transaction annulée, rien écrit en base. Relancer à blanc pour revoir le plan " +
          "(les fichiers déjà copiés sur Blob le seront de nouveau).",
      );
    }
  };
  const resolved = (target: string, column: string, value: SqlValue): SqlValue | undefined => {
    const upload = plan.uploads.find((u) => (u.id ?? `#${u.insert}`) === target && u.column === column);
    if (!upload) return value;
    return blobUrls.get(`${table}/${target}/${column}`); // undefined : envoi en échec → colonne non modifiée
  };

  for (const u of plan.updates) {
    const sets: string[] = [];
    const params: SqlValue[] = [u.id];
    for (const c of u.changes) {
      const value = resolved(u.id, c.column, c.to);
      if (value === undefined) continue;
      params.push(value);
      sets.push(`${client.escapeIdentifier(c.column)} = $${params.length}`);
      applied.push({ table, id: u.id, column: c.column, from: c.from, to: value });
    }
    if (sets.length === 0) continue;
    await guarded(u.id, u.title, sets.join(", "), params);
  }

  for (const [i, ins] of plan.inserts.entries()) {
    const columns: string[] = [];
    const params: SqlValue[] = [];
    for (const [column, value] of Object.entries(ins.values)) {
      const v = resolved(`#${i}`, column, value);
      if (v === undefined) continue; // fichier non copié : colonne laissée vide
      columns.push(client.escapeIdentifier(column));
      params.push(v);
    }
    const placeholders = params.map((_, k) => `$${k + 1}`);
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO ${tbl} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id::text AS id`,
      params,
    );
    applied.push({ table, id: rows[0].id, column: "*", from: null, to: `insertion : ${ins.title}` });
  }

  for (const u of plan.unpublish) {
    await guarded(u.id, u.title, "published = false", [u.id]);
    applied.push({ table, id: u.id, column: "published", from: true, to: false });
  }
}

// ─── Programme ──────────────────────────────────────────────────

async function main() {
  const backupPath = argValue("--backup");
  const appliedPath = backupPath && `${backupPath.replace(/\.json$/i, "")}.applied.json`;
  if (apply) {
    if (!backupPath || !appliedPath) {
      console.error("--apply exige --backup <fichier.json> (sauvegarde de l'état avant) : rien fait.");
      process.exit(1);
    }
    for (const f of [backupPath, appliedPath]) {
      if (existsSync(f)) {
        console.error(`${f} existe déjà : choisir un nouveau fichier (jamais écrasé). Rien fait.`);
        process.exit(1);
      }
    }
  }

  // 1. Lecture seule, connexion refermée avant le réseau.
  const { missing, actuRows, mediaRows, stores, versions } = await withClient((client) =>
    transaction(client, { write: false }, async (c) => {
      const missing = await missingColumns(c);
      return {
        missing,
        actuRows: await readActualites(c, missing),
        mediaRows: await readMedias(c, missing),
        stores: await existingStores(c, BLOB_COLUMNS),
        versions: {
          actualites: await readVersions(c, "actualites"),
          medias: await readVersions(c, "medias"),
        },
      };
    }),
  );
  if (missing.size) {
    const msg = `Colonnes absentes : ${[...missing].join(", ")} — lancer d'abord scripts/migrate-actu-medias.ts --apply.`;
    if (apply) {
      console.error(`${msg} Rien fait.`);
      process.exit(1);
    }
    console.log(`\nATTENTION : ${msg} (à blanc : lues comme vides)`);
  }
  const plans = {
    actualites: planActualites(staticActualites, actuRows),
    medias: planMedias(staticMedias, mediaRows),
  };
  console.log();
  for (const line of describePlan("actualites", plans.actualites, actuRows.length, staticActualites.length)) console.log(line);
  console.log();
  for (const line of describePlan("medias", plans.medias, mediaRows.length, staticMedias.length)) console.log(line);

  const list = jobs(plans);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = storeIdOf(token);
  const storeError = list.length ? checkStore(storeId, stores, argValue("--store")) : null;

  const total = (p: TablePlan) => p.updates.length + p.inserts.length + p.unpublish.length;
  if (total(plans.actualites) + total(plans.medias) === 0) {
    console.log("\nRien à faire : la base est alignée sur les pages.");
    return;
  }

  if (!apply) {
    if (list.length) {
      console.log(`\nVérification de ${list.length} fichier(s) à téléverser…`);
      const checks = await mapLimit(list, CONCURRENCY, (j) => checkOldSiteUrl(j.oldUrl, j.accept, fetchOptions));
      reportOutcomes(list, checks, "À téléverser");
      console.log(`Exemple de nom Blob : ${list[0].blobBase}.<ext du type reçu>`);
      console.log(storeError ? `--apply serait refusé : ${storeError}.` : "Store Blob : OK pour --apply.");
    }
    console.log("\nÀ blanc : rien écrit. Relancer avec --apply --backup <fichier.json> pour écrire.");
    return;
  }

  if (list.length && (storeError || !token || !storeId)) {
    console.error(`Store Blob : ${storeError ?? "jeton absent"}. Rien fait.`);
    process.exit(1);
  }

  // 2. Sauvegarde de l'état AVANT (lignes visées, complètes) ; 'wx' : jamais d'écrasement.
  const touched = (p: TablePlan) => [...p.updates.map((u) => u.id), ...p.unpublish.map((u) => u.id)];
  const before = await withClient((client) =>
    transaction(client, { write: false }, async (c) => ({
      actualites: await snapshot(c, "actualites", touched(plans.actualites)),
      medias: await snapshot(c, "medias", touched(plans.medias)),
    })),
  );
  writeFileSync(
    backupPath!,
    JSON.stringify({ createdAt: new Date().toISOString(), storeId, plans, before }, null, 2),
    { flag: "wx" },
  );
  console.log(`\nSauvegarde : ${before.actualites.length + before.medias.length} ligne(s) dans ${backupPath}`);

  // 3. Téléversements.
  const blobUrls = new Map<string, string>();
  let uploadFailures = 0;
  if (list.length) {
    console.log(`Copie de ${list.length} fichier(s) sur Blob…`);
    const outcomes = await mapLimit(list, CONCURRENCY, (j) =>
      uploadFromOldSite({ oldUrl: j.oldUrl, blobBase: j.blobBase, accept: j.accept }, token!, storeId!, fetchOptions),
    );
    uploadFailures = reportOutcomes(list, outcomes, "Envoyés sur Blob");
    list.forEach((j, i) => {
      const url = outcomes[i].url;
      if (url) blobUrls.set(`${j.table}/${j.id ?? `#${j.insert}`}/${j.column}`, url);
    });
    for (const [key, url] of blobUrls) console.log(`  ${key} → ${url}`);
  }

  // 4. Une transaction pour tout.
  const applied: Applied[] = [];
  await withClient((client) =>
    transaction(client, { write: true, lockTimeout: "5s" }, async (c) => {
      await applyPlan(c, "actualites", plans.actualites, blobUrls, versions.actualites, applied);
      await applyPlan(c, "medias", plans.medias, blobUrls, versions.medias, applied);
    }),
  );

  // Transaction validée : la suite n'est qu'un compte rendu.
  const appliedJson = JSON.stringify({ createdAt: new Date().toISOString(), storeId, changes: applied }, null, 2);
  try {
    writeFileSync(appliedPath!, appliedJson, { flag: "wx" });
    console.log(`\nAppliqué : ${applied.length} changement(s), journal dans ${appliedPath}`);
  } catch (err) {
    console.error(`\nÉcriture de ${appliedPath} impossible (${errMsg(err)}) : contenu à conserver ci-dessous.`);
    console.log(appliedJson);
  }
  if (blobUrls.size) {
    console.log("Reporter ces URL Blob dans src/lib/actu-medias-static.ts (repli sans base).");
  }
  if (uploadFailures) {
    console.log(`\n${uploadFailures} fichier(s) non copié(s) : colonne laissée telle quelle, relancer pour reprendre.`);
    process.exitCode = 1;
  } else {
    console.log("\nSynchronisation terminée. Une relance à blanc doit afficher « Rien à faire ».");
  }
}

runMain(main);
