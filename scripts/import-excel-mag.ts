/**
 * Reprise de l'historique des artisans depuis l'Excel de MAG (LOT A1) :
 * onglet « Artisan·e·s » (une ligne par artisan·e) et onglet « GLOBAL »
 * (type de poinçon, caisse AVS). Mapping : docs/plateforme-gestion.md § 5.
 *
 * Pour chaque ligne, rapprochement avec les fiches du site (nom + prénom,
 * sinon raison sociale, sinon nom seul « à confirmer », cf. src/lib/mag-excel.ts),
 * puis :
 *  - fiche rapprochée sans dossier → dossier lié (statut actif si la fiche est
 *    publiée, éligible sinon), journal « remarque » par commentaire daté,
 *    poinçon de la fiche complété depuis GLOBAL s'il est vide ;
 *  - fiche rapprochée qui a déjà un dossier → ignorée (script rejouable) ;
 *  - plusieurs fiches candidates → ambiguë, rien n'est écrit ;
 *  - aucune fiche et commentaire de sortie (faillite, retraite…) → dossier
 *    sans fiche, statut désactivé, date et motif du commentaire ;
 *  - aucune fiche, pas de sortie → ignorée, listée (fiche à créer ? sortie non notée ?).
 * La ligne « Retiré du répertoire » de l'onglet est un séparateur : les lignes
 * qui la suivent sont des sorties (motif « retrait du catalogue » si le
 * commentaire n'en dit pas plus, date du commentaire sinon inconnue) et ne
 * se rapprochent que sur nom + prénom ou raison sociale (jamais sur le nom seul).
 * Une ligne rapprochée dont le commentaire annonce une sortie alors que la
 * fiche est publiée n'est PAS désactivée : elle est signalée à vérifier.
 *
 * Sans --apply : lecture seule (transaction READ ONLY puis ROLLBACK), rapport.
 * --apply --backup <fichier.json> : sauvegarde (fichier neuf) des poinçons qui
 *   vont changer et du plan, puis écriture en une transaction, puis
 *   `<fichier>.applied.json` (dossiers créés, poinçons modifiés) pour --rollback.
 * --rollback <fichier.applied.json> [--apply] : supprime les dossiers créés
 *   (journal en cascade) et remet les poinçons tels qu'avant.
 * --confirm-surname : écrit aussi les rapprochements « nom seul » (sinon listés).
 * --link <ligne>=<slug>[,<ligne>=<slug>…] : rapprochements forcés à la main
 *   (lignes « non rapprochées » ou « ambiguës » du rapport, slug de la fiche).
 * --file <xlsx> : classeur (défaut docs/mag-inputs/Stat_GLOBALES.xlsx).
 * --offline : sans base, rapport sur les fiches des données statiques du site
 *   (src/lib/data.ts), pour vérifier la lecture du classeur et le rapprochement.
 *
 * Usage :
 *   npx tsx scripts/import-excel-mag.ts
 *   npx tsx scripts/import-excel-mag.ts --apply --backup backups/import-excel-2026-10-10.json
 *   npx tsx scripts/import-excel-mag.ts --rollback backups/import-excel-2026-10-10.json.applied.json --apply
 * Base : endpoint direct de Neon (scripts/lib/db-script.ts).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
import type { Client } from "pg";
import { apply, argValue, runDbScript, transaction, withClient } from "./lib/db-script";
import { findCommuneName } from "../src/lib/commune-match";
import {
  cellToIsoDate,
  detectExit,
  mapDomaine,
  matchArtisan,
  normalizeName,
  parseComment,
  parseTrainerCompany,
  poinconFromGlobal,
  splitAddress,
  splitMulti,
  surnameCase,
  type ExcelArtisanRow,
  type FicheCandidate,
  type MatchResult,
} from "../src/lib/mag-excel";
import { todayZurich } from "../src/lib/dossier-rules";
import { artisans as staticArtisans, categories as staticCategories, communesList as staticCommunes, EXCLUDED_TYPES } from "../src/lib/data";

const FILE = argValue("--file") ?? "docs/mag-inputs/Stat_GLOBALES.xlsx";
const BACKUP = argValue("--backup");
const ROLLBACK = argValue("--rollback");
const CONFIRM_SURNAME = process.argv.includes("--confirm-surname");
/** Rapprochements forcés : numéro de ligne Excel → slug de la fiche. */
const LINKS = new Map<number, string>(
  (argValue("--link") ?? "")
    .split(",")
    .filter(Boolean)
    .map((pair) => {
      const m = /^(\d+)=([a-z0-9-]+)$/.exec(pair.trim());
      if (!m) throw new Error(`--link : « ${pair} » attendu sous la forme ligne=slug`);
      return [Number(m[1]), m[2]];
    }),
);
const OFFLINE = process.argv.includes("--offline");
const AUTHOR = "Reprise Excel MAG";
const SHEET_ARTISANS = "Artisan·e·s";
const SHEET_GLOBAL = "GLOBAL";

// ─── Lecture du classeur ────────────────────────────────────────

/** Texte d'une cellule exceljs (texte riche, lien, formule, date, nombre) ; « - » = vide. */
function cellText(v: ExcelJS.CellValue): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("").trim() || null;
    if ("text" in v) return cellText(v.text as ExcelJS.CellValue);
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    if ("error" in v) return null;
    return null;
  }
  const s = String(v).trim();
  return s && s !== "-" ? s : null;
}

function cellRaw(v: ExcelJS.CellValue): unknown {
  if (v && typeof v === "object" && !(v instanceof Date) && "result" in v) return v.result;
  return v;
}

type GlobalInfo = { poincon: "ATELIER" | "BOUTIQUE" | "ENTREPRISE" | null; avsFund: string | null; name: string };

function readWorkbook(file: string): Promise<{ rows: ExcelArtisanRow[]; global: GlobalInfo[] }> {
  return new ExcelJS.Workbook().xlsx.readFile(file).then((wb) => {
    const ws = wb.getWorksheet(SHEET_ARTISANS);
    if (!ws) throw new Error(`Onglet « ${SHEET_ARTISANS} » introuvable dans ${file}`);
    const header = ws.getRow(3);
    const expect: Record<number, string> = { 1: "Commune", 2: "DATE INTÉGRATION", 3: "DOMAINE", 4: "METIER", 5: "NOM", 6: "PRÉNOM", 7: "RAISON SOCIALE", 8: "TÉLÉPHONE", 9: "MAIL", 10: "ADRESSE", 11: "COMMENTAIRES", 12: "ENTREPRISE FORMATRICE" };
    for (const [col, label] of Object.entries(expect)) {
      const got = cellText(header.getCell(Number(col)).value);
      if (normalizeName(got) !== normalizeName(label)) throw new Error(`Colonne ${col} de « ${SHEET_ARTISANS} » : « ${got} » attendu « ${label} » (structure du classeur changée ?)`);
    }
    const rows: ExcelArtisanRow[] = [];
    let retired = false;
    ws.eachRow((row, n) => {
      if (n < 4) return;
      const t = (c: number) => cellText(row.getCell(c).value);
      // Séparateur « Retiré du répertoire » (même libellé répété sur la ligne)
      const marker = [t(1), t(5), t(6)].filter(Boolean);
      if (marker.length >= 2 && marker.every((m) => /retir/i.test(m!))) {
        retired = true;
        return;
      }
      const r: ExcelArtisanRow = {
        rowNumber: n,
        commune: t(1),
        integratedAt: cellToIsoDate(cellRaw(row.getCell(2).value)),
        domaine: t(3),
        craft: t(4),
        lastName: t(5),
        firstName: t(6),
        workshopName: t(7),
        phone: t(8),
        email: t(9),
        address: t(10),
        comment: t(11),
        trainerCompany: t(12),
        retired,
      };
      if (r.lastName || r.firstName || r.workshopName) rows.push(r);
    });

    const global: GlobalInfo[] = [];
    const wg = wb.getWorksheet(SHEET_GLOBAL);
    if (wg) {
      wg.eachRow((row, n) => {
        if (n < 17) return;
        const name = cellText(row.getCell(1).value);
        if (!name) return;
        global.push({
          name,
          poincon: poinconFromGlobal(cellText(row.getCell(2).value), cellText(row.getCell(3).value), cellText(row.getCell(4).value)),
          avsFund: cellText(row.getCell(5).value),
        });
      });
    }
    return { rows, global };
  });
}

/** Entrée GLOBAL d'une ligne : « NOM Prénom » ou raison sociale, normalisés. */
function findGlobal(row: ExcelArtisanRow, global: GlobalInfo[]): GlobalInfo | null {
  const full = normalizeName(`${row.lastName ?? ""} ${row.firstName ?? ""}`);
  const rs = normalizeName(row.workshopName);
  const nom = normalizeName(row.lastName);
  const prenom = normalizeName(row.firstName);
  const has = (hay: string, needle: string) => !!needle && ` ${hay} `.includes(` ${needle} `);
  const exact = global.filter((g) => normalizeName(g.name) === full || (rs.length >= 4 && normalizeName(g.name) === rs));
  if (exact.length === 1) return exact[0];
  const loose = global.filter((g) => nom && prenom && has(normalizeName(g.name), nom) && has(normalizeName(g.name), prenom));
  return loose.length === 1 ? loose[0] : null;
}

// ─── Plan ───────────────────────────────────────────────────────

type DbArtisan = FicheCandidate & { published: boolean; poinconType: string | null; phone: string | null; email: string | null; website: string | null; hasDossier: boolean };

type Journal = { type: "remarque" | "desactivation"; occurredAt: string; text: string; motif: string | null };

type PlanItem = {
  row: ExcelArtisanRow;
  match: MatchResult;
  action: "lier" | "sortie" | "deja_un_dossier" | "ambigue" | "ignoree" | "nom_seul_a_confirmer";
  fiche?: DbArtisan;
  values?: Record<string, unknown>;
  journal: Journal[];
  poincon?: { artisanId: string; from: string | null; to: string };
  warnings: string[];
};

function buildValues(row: ExcelArtisanRow, cats: Map<string, string>, communeNames: string[], g: GlobalInfo | null, warnings: string[]): Record<string, unknown> {
  const addr = splitAddress(row.address);
  const phones = splitMulti(row.phone);
  const mails = splitMulti(row.email);
  const trainer = parseTrainerCompany(row.trainerCompany);
  const catName = mapDomaine(row.domaine, [...cats.keys()]);
  if (row.domaine && !catName) warnings.push(`domaine « ${row.domaine} » sans catégorie`);
  let commune: string | null = null;
  if (row.commune) {
    commune = findCommuneName(row.commune, communeNames) ?? null;
    if (!commune) warnings.push(`commune « ${row.commune} » hors liste (laissée vide)`);
  }
  const notes: string[] = [];
  if (phones.others.length) notes.push(`Autres téléphones : ${phones.others.join(" / ")}`);
  if (mails.others.length) notes.push(`Autres e-mails : ${mails.others.join(" / ")}`);
  return {
    first_name: row.firstName?.replace(/\s+/g, " ").trim() || null,
    last_name: surnameCase(row.lastName),
    workshop_name: row.workshopName?.trim() || null,
    category_id: catName ? cats.get(catName) : null,
    craft: row.craft,
    phone: phones.first,
    email: mails.first,
    street: addr.street,
    postal_code: addr.postalCode,
    city: addr.city,
    commune,
    trainer_company: trainer.trainerCompany,
    trainer_company_note: trainer.note,
    avs_affiliated: g?.avsFund ? true : null,
    avs_fund: g?.avsFund ?? null,
    poincon_type: g?.poincon ?? null,
    integrated_at: row.integratedAt,
    notes: notes.length ? notes.join("\n") : null,
    created_by: AUTHOR,
  };
}

function buildPlan(rows: ExcelArtisanRow[], global: GlobalInfo[], artisans: DbArtisan[], cats: Map<string, string>, communeNames: string[]): PlanItem[] {
  const today = todayZurich();
  const claimed = new Set<string>();
  return rows.map((row) => {
    const warnings: string[] = [];
    if ((row.lastName ?? "").split(/\s+/).length >= 4) warnings.push("nom suspect (phrase dans la colonne NOM)");
    let match = matchArtisan(row, artisans);
    const forced = LINKS.get(row.rowNumber);
    if (forced) {
      const fiche = artisans.find((a) => a.slug === forced);
      if (!fiche) throw new Error(`--link ${row.rowNumber}=${forced} : aucune fiche artisan avec ce slug`);
      match = { kind: "nom_prenom", fiche };
      warnings.push(`rapprochement forcé (--link) → « ${fiche.name} »`);
    }
    // Section des sorties : jamais de rapprochement sur le seul nom de famille.
    if (row.retired && match.kind === "nom_seul") match = { kind: "aucun" };
    const g = findGlobal(row, global);
    const comment = parseComment(row.comment);
    const exit = detectExit(comment.text) ?? (row.retired ? (comment.text ? "autre" : "retrait_catalogue") : null);
    const journal: Journal[] = [];
    if (comment.text) journal.push({ type: "remarque", occurredAt: comment.occurredAt ?? today, text: comment.occurredAt ? comment.text : `${comment.text} (commentaire Excel, non daté)`, motif: null });

    if (match.kind === "ambigu") return { row, match, action: "ambigue", journal, warnings: [`candidates : ${match.candidates.map((c) => c.name).join(" | ")}`] };

    if (match.kind === "nom_prenom" || match.kind === "raison_sociale" || match.kind === "nom_seul") {
      const fiche = artisans.find((a) => a.id === match.fiche.id)!;
      if (fiche.hasDossier || claimed.has(fiche.id)) return { row, match, action: "deja_un_dossier", fiche, journal, warnings: claimed.has(fiche.id) ? ["deux lignes Excel visent la même fiche"] : [] };
      if (match.kind === "nom_seul" && !CONFIRM_SURNAME) return { row, match, action: "nom_seul_a_confirmer", fiche, journal, warnings: [`fiche « ${fiche.name} » (nom seul) — relancer avec --confirm-surname pour écrire`] };
      claimed.add(fiche.id);
      const values = buildValues(row, cats, communeNames, g, warnings);
      values.artisan_id = fiche.id;
      values.status = fiche.published ? "actif" : "eligible";
      values.contact_public_consent = fiche.phone || fiche.email ? true : null;
      values.has_website = fiche.website ? true : null;
      values.website = fiche.website;
      if (exit) warnings.push(`${row.retired ? "section « retiré du répertoire »" : `commentaire de sortie (${exit})`} mais fiche ${fiche.published ? "publiée" : "non publiée"} : à vérifier, non désactivée`);
      const poincon = g?.poincon && !fiche.poinconType ? { artisanId: fiche.id, from: fiche.poinconType, to: g.poincon } : undefined;
      return { row, match, action: "lier", fiche, values, journal, poincon, warnings };
    }

    if (exit) {
      const values = buildValues(row, cats, communeNames, g, warnings);
      values.status = "desactive";
      values.deactivated_at = comment.occurredAt;
      values.deactivation_reason = exit;
      if (!comment.occurredAt) warnings.push("date de sortie inconnue");
      journal.push({ type: "desactivation", occurredAt: comment.occurredAt ?? today, text: comment.text ? `Sortie reprise de l'Excel : ${comment.text}` : "Sortie reprise de l'Excel (section « retiré du répertoire »)", motif: exit });
      return { row, match, action: "sortie", values, journal, warnings };
    }
    return { row, match, action: "ignoree", journal, warnings: ["aucune fiche sur le site, pas de sortie notée"] };
  });
}

// ─── Rapport ────────────────────────────────────────────────────

const LABELS: Record<PlanItem["action"], string> = {
  lier: "rapprochée → dossier lié",
  sortie: "sortie → dossier désactivé sans fiche",
  deja_un_dossier: "déjà un dossier (ignorée)",
  nom_seul_a_confirmer: "nom seul, à confirmer (non écrite)",
  ambigue: "ambiguë (non écrite)",
  ignoree: "non rapprochée (ignorée)",
};

function who(r: ExcelArtisanRow): string {
  return [r.lastName, r.firstName].filter(Boolean).join(" ") + (r.workshopName ? ` / ${r.workshopName}` : "");
}

function report(plan: PlanItem[], global: GlobalInfo[]): void {
  const counts = Object.fromEntries(Object.keys(LABELS).map((k) => [k, plan.filter((p) => p.action === k).length]));
  console.log(`\nLignes Excel : ${plan.length}`);
  for (const [k, label] of Object.entries(LABELS)) console.log(`  ${String(counts[k]).padStart(4)}  ${label}`);
  console.log(`  ${String(plan.filter((p) => p.poincon).length).padStart(4)}  poinçons de fiche complétés depuis GLOBAL`);
  console.log(`  ${String(global.length).padStart(4)}  entrées GLOBAL lues`);
  for (const action of ["lier", "sortie", "nom_seul_a_confirmer", "ambigue", "ignoree", "deja_un_dossier"] as const) {
    const items = plan.filter((p) => p.action === action);
    if (!items.length) continue;
    console.log(`\n— ${LABELS[action]} :`);
    for (const p of items) {
      const target = p.fiche ? ` → « ${p.fiche.name} » (${p.values?.status ?? (p.fiche.published ? "publiée" : "non publiée")})` : p.values ? ` → ${p.values.status} ${p.values.deactivated_at ?? ""} ${p.values.deactivation_reason ?? ""}` : "";
      const extras = [p.journal.length ? `${p.journal.length} entrée(s) de journal` : "", p.poincon ? `poinçon ${p.poincon.to}` : "", ...p.warnings].filter(Boolean);
      console.log(`  l.${String(p.row.rowNumber).padStart(3)}  ${who(p.row)}${target}${extras.length ? `  [${extras.join(" ; ")}]` : ""}`);
    }
  }
}

// ─── Écriture ───────────────────────────────────────────────────

type Applied = { file: string; createdAt: string; dossiers: { id: string; artisanId: string | null; row: number }[]; poincons: { artisanId: string; from: string | null; to: string }[] };

async function insertDossier(c: Client, values: Record<string, unknown>): Promise<string> {
  const cols = Object.keys(values);
  const sql = `INSERT INTO artisan_dossiers (${cols.map((k) => c.escapeIdentifier(k)).join(", ")}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING id`;
  const res = await c.query(sql, cols.map((k) => values[k]));
  return res.rows[0].id as string;
}

async function run(): Promise<void> {
  const { rows, global } = await readWorkbook(FILE);
  console.log(`Classeur : ${FILE} — ${rows.length} lignes « ${SHEET_ARTISANS} », ${global.length} lignes GLOBAL`);

  if (OFFLINE) {
    const excluded = new Set<string>(EXCLUDED_TYPES);
    const artisans: DbArtisan[] = staticArtisans
      .filter((a) => !excluded.has(a.type ?? "artisan"))
      .map((a, i) => ({ id: `static-${i}`, name: a.name, slug: a.slug, published: true, poinconType: null, phone: null, email: null, website: null, hasDossier: false }));
    const cats = new Map<string, string>(staticCategories.map((c, i) => [c.name, `cat-${i}`]));
    console.log(`Hors ligne : ${artisans.length} fiches statiques, ${cats.size} catégories, ${staticCommunes.length} communes`);
    report(buildPlan(rows, global, artisans, cats, staticCommunes.map((c) => c.name)), global);
    return;
  }

  runDbScript<Applied | null>({
    lockTimeout: "5s",
    run: async (c) => {
      const [artisansRes, catsRes, communesRes] = await Promise.all([
        c.query(`SELECT a.id, a.name, a.slug, a.published, a.poincon_type, a.phone, a.email, a.website, d.id AS dossier_id
                 FROM artisans a LEFT JOIN artisan_dossiers d ON d.artisan_id = a.id
                 WHERE a.type IS NULL OR a.type IN ('artisan', 'atelier', 'entreprise')`),
        c.query(`SELECT id, name FROM categories`),
        c.query(`SELECT name FROM communes ORDER BY name`),
      ]);
      const artisans: DbArtisan[] = artisansRes.rows.map((r) => ({
        id: r.id, name: r.name, slug: r.slug, published: !!r.published, poinconType: r.poincon_type, phone: r.phone, email: r.email, website: r.website, hasDossier: !!r.dossier_id,
      }));
      const cats = new Map<string, string>(catsRes.rows.map((r) => [r.name as string, r.id as string]));
      const communeNames = communesRes.rows.map((r) => r.name as string);
      console.log(`Base : ${artisans.length} fiches artisan (${artisans.filter((a) => a.hasDossier).length} avec dossier), ${cats.size} catégories, ${communeNames.length} communes`);

      const plan = buildPlan(rows, global, artisans, cats, communeNames);
      report(plan, global);
      const writes = plan.filter((p) => p.values);
      if (!apply) {
        console.log(`\n— lecture à blanc : ${writes.length} dossier(s) seraient créés. Relancer avec --apply --backup <fichier.json>.`);
        return null;
      }
      if (!BACKUP) throw new Error("--apply exige --backup <fichier.json>");
      if (existsSync(BACKUP)) throw new Error(`${BACKUP} existe déjà : choisir un nouveau fichier`);
      writeFileSync(BACKUP, JSON.stringify({ file: FILE, createdAt: new Date().toISOString(), plan: writes.map((p) => ({ row: p.row.rowNumber, action: p.action, fiche: p.fiche?.id ?? null, values: p.values, journal: p.journal, poincon: p.poincon ?? null })) }, null, 2));
      console.log(`\nSauvegarde du plan : ${BACKUP}`);

      const applied: Applied = { file: FILE, createdAt: new Date().toISOString(), dossiers: [], poincons: [] };
      for (const p of writes) {
        const id = await insertDossier(c, p.values!);
        applied.dossiers.push({ id, artisanId: (p.values!.artisan_id as string | undefined) ?? null, row: p.row.rowNumber });
        for (const j of p.journal) {
          await c.query(`INSERT INTO artisan_journal (dossier_id, type, occurred_at, text, motif, author) VALUES ($1, $2, $3, $4, $5, $6)`, [id, j.type, j.occurredAt, j.text, j.motif, AUTHOR]);
        }
        if (p.poincon) {
          const res = await c.query(`UPDATE artisans SET poincon_type = $1 WHERE id = $2 AND coalesce(poincon_type, '') = ''`, [p.poincon.to, p.poincon.artisanId]);
          if (res.rowCount) applied.poincons.push(p.poincon);
        }
      }
      console.log(`Écrit : ${applied.dossiers.length} dossiers, ${applied.poincons.length} poinçons.`);
      return applied;
    },
    afterCommit: (_c, applied) => {
      if (!applied || !BACKUP) return;
      const out = `${BACKUP}.applied.json`;
      writeFileSync(out, JSON.stringify(applied, null, 2));
      console.log(`Journal des écritures : ${out} (pour --rollback)`);
    },
    afterCommitError: "Import validé, mais l'écriture du fichier .applied.json a échoué :",
  });
}

async function rollback(file: string): Promise<void> {
  const applied = JSON.parse(readFileSync(file, "utf8")) as Applied;
  if (!Array.isArray(applied.dossiers) || !Array.isArray(applied.poincons)) throw new Error(`${file} : format inattendu`);
  await withClient((client) =>
    transaction(client, { write: apply, lockTimeout: "5s" }, async (c) => {
      let removed = 0;
      for (const d of applied.dossiers) {
        const res = await c.query(`DELETE FROM artisan_dossiers WHERE id = $1 AND created_by = $2`, [d.id, AUTHOR]);
        removed += res.rowCount ?? 0;
      }
      let restored = 0;
      for (const p of applied.poincons) {
        const res = await c.query(`UPDATE artisans SET poincon_type = $1 WHERE id = $2 AND poincon_type IS NOT DISTINCT FROM $3`, [p.from, p.artisanId, p.to]);
        restored += res.rowCount ?? 0;
      }
      console.log(`${apply ? "Retour arrière" : "Retour arrière (à blanc)"} : ${removed}/${applied.dossiers.length} dossiers supprimés, ${restored}/${applied.poincons.length} poinçons restaurés.`);
    }),
  );
}

if (ROLLBACK) {
  rollback(ROLLBACK).catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
