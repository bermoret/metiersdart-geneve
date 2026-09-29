/**
 * Détache de l'ancien site Joomla les LIENS en base qui visent une de ses
 * pages (pas un fichier), avant la bascule DNS de metiersdart-geneve.ch.
 * Pendant de scripts/migrate-images-to-blob.ts (fichiers → Vercel Blob).
 *
 * Colonne traitée : artisans.poincon_modal_link (lien « En savoir plus » de la
 * fenêtre du poinçon). État au 29.09.2026 : 128 fiches, toutes sur la page
 * SP Page Builder id=630 « Poinçons MAG ». Le nouveau site n'a pas de page
 * équivalente : le lien est retiré (NULL) et PoinconBadge masque alors l'invite
 * « Cliquez ici pour en savoir plus. » du texte. Si une page des poinçons est
 * créée plus tard, mettre son chemin dans PAGE_LINKS au lieu de null.
 *
 * Une URL de l'ancien site absente de PAGE_LINKS n'est jamais modifiée : elle
 * est signalée (fichier → migrate-images-to-blob.ts ; page → compléter
 * PAGE_LINKS). medias.external_url (2 PDF de /presse/) est seulement listé :
 * table gérée ailleurs.
 *
 * Réseau : aucun (ni téléchargement ni Blob).
 *
 * --apply --backup <fichier.json> :
 *   1. sauvegarde {table, column, id, key, oldUrl, newUrl} des lignes visées
 *      (fichier neuf : refus s'il existe déjà) — avant toute écriture ;
 *   2. une transaction : UPDATE … WHERE id = $1 AND <col> = <ancienne URL>
 *      (une valeur modifiée entre-temps dans l'admin n'est jamais écrasée) ;
 *   3. après le COMMIT, `<fichier>.applied.json` : lignes RÉELLEMENT modifiées,
 *      base du retour arrière (--rollback, à blanc sans --apply).
 * updated_at n'est pas modifié (comme migrate-images-to-blob.ts).
 *
 * Usage :
 *   npx tsx scripts/migrate-joomla-links.ts                                   → à blanc
 *   npx tsx scripts/migrate-joomla-links.ts --apply --backup <f.json>
 *   npx tsx scripts/migrate-joomla-links.ts --rollback <f.applied.json> [--apply]
 * Base : endpoint direct de Neon (scripts/lib/db-script.ts).
 */
import { existsSync, writeFileSync } from "node:fs";
import type { Client } from "pg";
import {
  apply,
  argValue,
  rollbackApplied,
  runDbScript,
  runMain,
  type AppliedRow,
} from "./lib/db-script";

/** Hôte de l'ancien site (POSIX, insensible à la casse) : même filtre que migrate-images-to-blob.ts. */
const OLD_HOST_SQL = "^\\s*https?://(www\\.)?metiersdart-geneve\\.ch([/:?#]|$)";
const OLD_HOSTS = new Set(["metiersdart-geneve.ch", "www.metiersdart-geneve.ch"]);

const TARGETS = [{ table: "artisans", column: "poincon_modal_link", key: "slug" }] as const;
/** Listées seulement, jamais écrites. */
const REPORT_ONLY = [{ table: "medias", column: "external_url", key: "title" }] as const;

interface PageLink {
  label: string;
  /** Page SP Page Builder : /index.php?option=com_sppagebuilder&view=page&id=<id>. */
  sppbId: string;
  /** Nouveau lien (chemin du nouveau site), ou null pour retirer le lien. */
  to: string | null;
}

const PAGE_LINKS: PageLink[] = [{ label: "Poinçons MAG (sans équivalent)", sppbId: "630", to: null }];

/** Fichier statique de l'ancien site (image, PDF…), par opposition à une page. */
function isFile(u: URL): boolean {
  return /^\/(images|presse|media)\//i.test(u.pathname) || /\.(pdf|jpe?g|png|gif|webp|svg|docx?)$/i.test(u.pathname);
}

type Verdict = { kind: "page"; link: PageLink } | { kind: "fichier" | "page inconnue" | "invalide" };

function classify(raw: string): Verdict {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return { kind: "invalide" };
  }
  // Le filtre SQL est large (`…ch:x@evil.com` passe) : ce contrôle fait foi.
  if (!OLD_HOSTS.has(u.hostname) || u.username || u.password || u.port) return { kind: "invalide" };
  if (isFile(u)) return { kind: "fichier" };
  const q = u.searchParams;
  const link =
    u.pathname === "/index.php" && q.get("option") === "com_sppagebuilder" && q.get("view") === "page"
      ? PAGE_LINKS.find((l) => l.sppbId === q.get("id"))
      : undefined;
  return link ? { kind: "page", link } : { kind: "page inconnue" };
}

interface Row {
  table: string;
  column: string;
  id: string;
  key: string;
  oldUrl: string;
}

async function readRows(c: Client, t: { table: string; column: string; key: string }): Promise<Row[]> {
  const col = c.escapeIdentifier(t.column);
  const res = await c.query<{ id: string; key: string; url: string }>(
    `SELECT id::text AS id, ${c.escapeIdentifier(t.key)}::text AS key, ${col} AS url
       FROM ${c.escapeIdentifier(t.table)} WHERE ${col} ~* $1 ORDER BY 2`,
    [OLD_HOST_SQL],
  );
  return res.rows.map((r) => ({ table: t.table, column: t.column, id: r.id, key: r.key, oldUrl: r.url }));
}

/** Regroupe par URL (128 fiches → 1 lien) : compte, verdict, 3 exemples. */
function report(title: string, rows: Row[]) {
  console.log(`\n${title} : ${rows.length} ligne(s) sur l'ancien site`);
  const byUrl = new Map<string, Row[]>();
  for (const r of rows) byUrl.set(r.oldUrl, [...(byUrl.get(r.oldUrl) ?? []), r]);
  for (const [url, list] of byUrl) {
    const v = classify(url);
    const verdict =
      v.kind === "page" ? `page « ${v.link.label} » → ${v.link.to ?? "lien retiré (NULL)"}` : `${v.kind} : inchangé`;
    const ex = list.slice(0, 3).map((r) => r.key).join(", ");
    console.log(`  ${list.length} × ${url}\n      ${verdict}\n      ex. ${ex}${list.length > 3 ? ", …" : ""}`);
  }
}

function main() {
  const rollbackPath = argValue("--rollback");
  if (process.argv.includes("--rollback")) {
    if (!rollbackPath) {
      console.error("--rollback exige un fichier <…>.applied.json : rien fait.");
      process.exit(1);
    }
    runMain(() => rollbackApplied(rollbackPath, TARGETS));
    return;
  }

  const backupPath = argValue("--backup");
  const appliedPath = backupPath && `${backupPath.replace(/\.json$/i, "")}.applied.json`;
  if (apply) {
    if (!backupPath || !appliedPath) {
      console.error("--apply exige --backup <fichier.json> (sauvegarde des anciens liens) : rien fait.");
      process.exit(1);
    }
    for (const f of [backupPath, appliedPath]) {
      if (existsSync(f)) {
        console.error(`${f} existe déjà : choisir un nouveau fichier (jamais écrasé). Rien fait.`);
        process.exit(1);
      }
    }
  }

  runDbScript<{ applied: AppliedRow[]; kept: Row[] }>({
    lockTimeout: "5s",
    run: async (c) => {
      const rows: Row[] = [];
      for (const t of TARGETS) {
        const mine = await readRows(c, t);
        report(`${t.table}.${t.column}`, mine);
        rows.push(...mine);
      }
      for (const t of REPORT_ONLY) {
        report(`${t.table}.${t.column} (listé seulement, jamais écrit)`, await readRows(c, t));
      }

      const todo = rows.flatMap((r) => {
        const v = classify(r.oldUrl);
        return v.kind === "page" ? [{ ...r, newUrl: v.link.to }] : [];
      });
      const untouched = rows.length - todo.length;
      if (!apply) {
        console.log(
          `\nÀ blanc : ${todo.length} lien(s) à modifier, ${untouched} inchangé(s). ` +
            "Relancer avec --apply --backup <fichier.json> pour écrire.",
        );
        return { applied: [], kept: [] };
      }
      if (todo.length === 0) {
        console.log("\nRien à modifier.");
        return { applied: [], kept: [] };
      }

      // Sauvegarde AVANT toute écriture ; 'wx' : jamais d'écrasement.
      writeFileSync(backupPath!, JSON.stringify({ createdAt: new Date().toISOString(), rows: todo }, null, 2), {
        flag: "wx",
      });
      console.log(`\nSauvegarde : ${todo.length} ligne(s) dans ${backupPath}`);

      const applied: AppliedRow[] = [];
      const kept: Row[] = [];
      for (const r of todo) {
        const col = c.escapeIdentifier(r.column);
        const res = await c.query(
          `UPDATE ${c.escapeIdentifier(r.table)} SET ${col} = $3 WHERE id = $1 AND ${col} = $2`,
          [r.id, r.oldUrl, r.newUrl],
        );
        if (res.rowCount === 1) {
          applied.push({ table: r.table, column: r.column, id: r.id, oldUrl: r.oldUrl, newUrl: r.newUrl });
        } else {
          kept.push(r);
        }
      }
      return { applied, kept };
    },
    // Transaction validée : la suite n'est qu'un compte rendu.
    afterCommit: (_c, { applied, kept }) => {
      if (applied.length === 0 && kept.length === 0) return;
      const json = JSON.stringify({ createdAt: new Date().toISOString(), rows: applied }, null, 2);
      try {
        writeFileSync(appliedPath!, json, { flag: "wx" });
        console.log(`Lignes modifiées (base du retour arrière) : ${applied.length} dans ${appliedPath}`);
      } catch (err) {
        console.error(`Écriture de ${appliedPath} impossible (${String(err)}) : contenu à conserver ci-dessous.`);
        console.log(json);
      }
      for (const r of kept) console.log(`  inchangée (modifiée entre-temps) : ${r.table} ${r.key}`);
      console.log(`Base mise à jour : ${applied.length} ligne(s), ${kept.length} inchangée(s).`);
    },
    afterCommitError: "Liens modifiés (transaction validée), mais le compte rendu a échoué :",
  });
}

main();
