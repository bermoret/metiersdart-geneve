// Garde-fou du LOT A1 : les tables internes (artisan_dossiers, artisan_documents,
// artisan_journal) et les helpers serveur des dossiers ne sont utilisés que
// par l'admin (pages /admin, routes /api/admin, composants admin). Aucune
// page publique, route publique ni sitemap ne peut y toucher.
// Test statique sur les sources (docs/plateforme-gestion.md § 9).
import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "src");
const INTERNAL_TABLES = ["artisanDossiers", "artisanDocuments", "artisanJournal", "dossierStatusEnum", "journalTypeEnum"];
const INTERNAL_MODULES = ["@/lib/dossiers-db", "./dossiers-db", "../dossiers-db"];

/** Emplacements autorisés à lire les tables internes. */
const ALLOWED = [/^app\/admin\//, /^app\/api\/admin\//, /^components\/admin\//, /^lib\/dossiers-db\.ts$/, /^db\//];

/** Source sans commentaires : une mention dans un commentaire n'est pas une exposition. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(p);
  }
  return out;
}

describe("non-exposition des dossiers artisans", () => {
  const files = walk(ROOT);

  test("les tables internes existent dans le schéma", () => {
    const schema = readFileSync(join(ROOT, "db/schema.ts"), "utf8");
    for (const t of INTERNAL_TABLES) assert.ok(schema.includes(`export const ${t}`), t);
  });

  test("hors admin, aucun fichier ne référence les tables ni les helpers internes", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const rel = relative(ROOT, file).split("\\").join("/");
      if (ALLOWED.some((re) => re.test(rel))) continue;
      const src = stripComments(readFileSync(file, "utf8"));
      const hit =
        INTERNAL_TABLES.find((t) => new RegExp(`\\b${t}\\b`).test(src)) ??
        INTERNAL_MODULES.find((m) => src.includes(`"${m}"`) || src.includes(`'${m}'`));
      if (hit) offenders.push(`${rel} → ${hit}`);
    }
    assert.deepEqual(offenders, []);
  });

  test("la couche publique (db-data, queries, sitemap) ignore les dossiers", () => {
    for (const rel of ["lib/db-data.ts", "lib/queries.ts", "app/sitemap.ts"]) {
      const src = readFileSync(join(ROOT, rel), "utf8");
      assert.ok(!/dossier|artisan_documents|artisan_journal/i.test(src), rel);
    }
  });

  test("la route publique /api/annonces et les pages publiques n'importent rien de l'admin", () => {
    for (const file of files) {
      const rel = relative(ROOT, file).split("\\").join("/");
      if (!rel.startsWith("app/") || rel.startsWith("app/admin/") || rel.startsWith("app/api/admin/")) continue;
      const src = readFileSync(file, "utf8");
      assert.ok(!/from "@\/components\/admin\//.test(src), rel);
    }
  });
});
