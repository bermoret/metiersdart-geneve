/**
 * Contrôle croisé (LOT A2) entre le classeur de MAG (onglet « Artisan·e·s »,
 * lignes avant « Retiré du répertoire ») et la base (dossiers actifs et
 * fiches publiées) : effectifs, par domaine, par commune, et lignes qui ne se
 * retrouvent pas d'un côté ou de l'autre. Lecture seule, rien n'est écrit.
 *
 * Usage : npx tsx scripts/check-excel-vs-db.ts [--file docs/mag-inputs/Stat_GLOBALES.xlsx]
 * Base : DATABASE_URL (sinon .env.local), endpoint direct (scripts/lib/db-script.ts).
 */
import { argValue, runMain, transaction, withClient } from "./lib/db-script";
import { readMagWorkbook } from "./lib/mag-workbook";
import { mapDomaine, matchArtisan, type FicheCandidate } from "../src/lib/mag-excel";
import { excelDomaineLabel } from "../src/lib/excel-export-rules";
import { findCommuneName } from "../src/lib/commune-match";

const FILE = argValue("--file") ?? "docs/mag-inputs/Stat_GLOBALES.xlsx";

function table(title: string, left: Map<string, number>, right: Map<string, number>, l = "Excel", r = "Base"): void {
  const keys = [...new Set([...left.keys(), ...right.keys()])].sort((a, b) => a.localeCompare(b, "fr"));
  console.log(`\n— ${title} (${l} / ${r}) :`);
  let diff = 0;
  for (const k of keys) {
    const a = left.get(k) ?? 0;
    const b = right.get(k) ?? 0;
    if (a !== b) diff++;
    console.log(`  ${(a === b ? "  " : "≠ ") + k.padEnd(44)} ${String(a).padStart(4)} ${String(b).padStart(4)}`);
  }
  console.log(`  ${diff ? `${diff} écart(s)` : "aucun écart"}`);
}

const count = <T,>(rows: T[], key: (r: T) => string | null): Map<string, number> => {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r) ?? "(non renseigné)";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
};

runMain(async () => {
  const { rows } = await readMagWorkbook(FILE);
  const excelActifs = rows.filter((r) => !r.retired);
  console.log(`Classeur : ${FILE} — ${excelActifs.length} lignes actives, ${rows.length - excelActifs.length} retirées`);

  await withClient((client) =>
    transaction(client, { write: false, lockTimeout: "5s" }, async (c) => {
      const [cats, coms, dossiers, published] = await Promise.all([
        c.query<{ name: string }>(`SELECT name FROM categories`),
        c.query<{ name: string }>(`SELECT name FROM communes ORDER BY name`),
        c.query<{ id: string; status: string; last_name: string | null; first_name: string | null; workshop_name: string | null; commune: string | null; fiche_name: string | null; fiche_commune: string | null; category: string | null; fiche_published: boolean | null }>(
          `SELECT d.id, d.status, d.last_name, d.first_name, d.workshop_name, d.commune,
                  a.name AS fiche_name, a.commune AS fiche_commune, a.published AS fiche_published, c.name AS category
           FROM artisan_dossiers d LEFT JOIN artisans a ON a.id = d.artisan_id LEFT JOIN categories c ON c.id = a.category_id`,
        ),
        c.query<{ id: string; name: string; slug: string; commune: string | null; category: string | null }>(
          `SELECT a.id, a.name, a.slug, a.commune, c.name AS category FROM artisans a LEFT JOIN categories c ON c.id = a.category_id
           WHERE a.published = true AND (a.type IS NULL OR a.type IN ('artisan','atelier','entreprise'))`,
        ),
      ]);
      const catNames = cats.rows.map((r) => r.name);
      const communeNames = coms.rows.map((r) => r.name);
      const dbActifs = dossiers.rows.filter((d) => d.status === "actif");
      console.log(`Base : ${dbActifs.length} dossiers actifs, ${dossiers.rows.length} dossiers, ${published.rows.length} fiches artisan publiées`);

      console.log(`\n— Effectifs : Excel ${excelActifs.length} / dossiers actifs ${dbActifs.length} / fiches publiées ${published.rows.length}`);
      table(
        "Par domaine",
        count(excelActifs, (r) => excelDomaineLabel(mapDomaine(r.domaine, catNames)) ?? r.domaine),
        count(dbActifs, (d) => excelDomaineLabel(d.category)),
      );
      table(
        "Par commune",
        count(excelActifs, (r) => (r.commune ? findCommuneName(r.commune, communeNames) ?? r.commune : null)),
        count(dbActifs, (d) => d.fiche_commune ?? d.commune),
      );

      // Lignes Excel sans dossier (rapprochement par nom / raison sociale sur les fiches et les dossiers)
      const candidates: FicheCandidate[] = dossiers.rows.map((d) => ({
        id: d.id,
        name: d.fiche_name ?? [d.first_name, d.last_name].filter(Boolean).join(" ") + (d.workshop_name ? ` — ${d.workshop_name}` : ""),
        slug: d.id,
      }));
      const matchedIds = new Set<string>();
      const missing: string[] = [];
      for (const r of excelActifs) {
        const m = matchArtisan(r, candidates);
        if (m.kind === "aucun" || m.kind === "ambigu") missing.push(`l.${r.rowNumber} ${[r.lastName, r.firstName].filter(Boolean).join(" ")} / ${r.workshopName ?? ""}${m.kind === "ambigu" ? " (ambigu)" : ""}`);
        else matchedIds.add(m.fiche.id);
      }
      const extra = dbActifs.filter((d) => !matchedIds.has(d.id)).map((d) => d.fiche_name ?? `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim());
      console.log(`\n— Lignes Excel actives sans dossier (${missing.length}) :`);
      for (const m of missing) console.log("  " + m);
      console.log(`\n— Dossiers actifs absents de l'Excel (${extra.length}) :`);
      for (const e of extra) console.log("  " + e);
      const notPublished = dbActifs.filter((d) => !d.fiche_published).map((d) => d.fiche_name ?? "(sans fiche)");
      console.log(`\n— Dossiers actifs dont la fiche n'est pas publiée (${notPublished.length}) : ${notPublished.join(", ") || "—"}`);
    }),
  );
});
