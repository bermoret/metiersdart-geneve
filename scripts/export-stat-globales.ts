/**
 * Génère le classeur Stat_GLOBALES depuis la base (comme le bouton de
 * l'admin), ou hors ligne depuis les données statiques du site pour vérifier
 * la mécanique du gabarit sans base.
 *
 * Usage :
 *   npx tsx scripts/export-stat-globales.ts [--out backups/Stat_GLOBALES_export.xlsx]
 *   npx tsx scripts/export-stat-globales.ts --offline --out /tmp/test.xlsx
 * Base : DATABASE_URL (sinon .env.local), lecture seule.
 */
import { existsSync, writeFileSync } from "node:fs";
import { argValue } from "./lib/db-script";
import { buildStatGlobales, statGlobalesFilename, type ExportData } from "../src/lib/excel-export";
import { todayZurich } from "../src/lib/dossier-rules";

const OFFLINE = process.argv.includes("--offline");

async function offlineData(): Promise<ExportData> {
  const { artisans, categories, communesList, EXCLUDED_CATEGORY_SLUGS } = await import("../src/lib/data");
  const artisanTypes = new Set(["artisan", "atelier", "entreprise"]);
  return {
    generatedAt: todayZurich(),
    artisans: artisans
      .filter((a) => artisanTypes.has(a.type))
      .map((a) => ({
        status: "actif" as const,
        integratedAt: null, deactivatedAt: null, deactivationReason: null,
        lastName: null, firstName: null, workshopName: a.name, phone: null, email: null,
        street: null, postalCode: null, city: null, commune: a.commune,
        trainerCompany: null, trainerCompanyNote: null, avsFund: null, poinconType: null,
        ficheName: a.name, craft: a.craft, categoryName: a.categoryName, comments: [],
      })),
    categories: categories.filter((c) => !EXCLUDED_CATEGORY_SLUGS.includes(c.slug)).map((c) => c.name),
    communes: communesList.map((c) => ({ name: c.name, soutientMag: false })),
    entities: artisans.map((a) => ({ name: a.name, type: a.type, commune: a.commune })),
  };
}

async function main(): Promise<void> {
  let data: ExportData;
  if (OFFLINE) {
    data = await offlineData();
    console.log(`Hors ligne : ${data.artisans.length} fiches statiques, ${data.categories.length} domaines, ${data.communes.length} communes`);
  } else {
    if (!process.env.DATABASE_URL && existsSync(".env.local")) process.loadEnvFile(".env.local");
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL requis (ou --offline)");
    const { loadExportData } = await import("../src/lib/stats-db");
    data = await loadExportData();
    console.log(`Base : ${data.artisans.length} dossiers (actifs + sortis), ${data.entities.length} fiches publiées`);
  }
  const out = argValue("--out") ?? `backups/${statGlobalesFilename(data.generatedAt)}`;
  writeFileSync(out, await buildStatGlobales(data));
  console.log(`Classeur écrit : ${out}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
