/**
 * Complète `artisans.long_description` (texte « À propos » des fiches) à
 * partir de src/lib/artisan-details.ts.
 *
 * Contexte (retours MAG du 23.09.2026) : 101 fiches publiées sur 145 n'avaient
 * aucun texte visible — le premier scraping du site Joomla n'avait pas capté
 * leur présentation, le seed a donc écrit NULL. Les textes ont été repris dans
 * artisan-details.ts ; ce script les reporte en base.
 *
 * Ne remplit QUE les descriptions vides : un texte saisi dans l'admin n'est
 * jamais écrasé (condition répétée dans l'UPDATE).
 *
 * Usage :
 *   npx tsx scripts/backfill-descriptions.ts          → à blanc, connexion en lecture seule
 *   npx tsx scripts/backfill-descriptions.ts --apply  → écrit, en une transaction
 * (DATABASE_URL, sinon lu dans .env.local)
 */
import { existsSync } from "node:fs";
import { Client } from "pg";
import { artisans as staticArtisans } from "../src/lib/data";
import { artisanDetails, getArtisanDetail } from "../src/lib/artisan-details";

const apply = process.argv.includes("--apply");

if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

/**
 * Texte de la fiche : via le nom statique du même slug, sinon via le nom exact
 * en base (jamais par mots-clés : une fiche créée dans l'admin ne doit pas
 * recevoir le texte d'une autre).
 */
function descriptionFor(slug: string, name: string): string | null {
  const staticName = staticArtisans.find((a) => a.slug === slug)?.name;
  const detail =
    (staticName ? getArtisanDetail(staticName) : undefined) ?? artisanDetails[name];
  return detail?.description?.trim() || null;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    if (!apply) await client.query("SET default_transaction_read_only = on");

    const { rows } = await client.query<{ id: string; slug: string; name: string; published: boolean }>(
      `SELECT id, slug, name, published FROM artisans
        WHERE coalesce(btrim(long_description), '') = ''
        ORDER BY name`,
    );

    const todo = rows
      .map((r) => ({ ...r, text: descriptionFor(r.slug, r.name) }))
      .filter((r): r is typeof r & { text: string } => r.text !== null);
    const missing = rows.filter((r) => !todo.some((t) => t.id === r.id));

    for (const r of todo) {
      console.log(`${apply ? "écrit" : "à écrire"}  ${r.slug}${r.published ? "" : " (non publiée)"} — ${r.text.slice(0, 60)}…`);
    }
    for (const r of missing) console.log(`sans texte  ${r.slug}`);

    if (apply && todo.length > 0) {
      await client.query("BEGIN");
      let updated = 0;
      for (const r of todo) {
        const res = await client.query(
          `UPDATE artisans SET long_description = $1, updated_at = now()
            WHERE id = $2 AND coalesce(btrim(long_description), '') = ''`,
          [r.text, r.id],
        );
        updated += res.rowCount ?? 0;
      }
      await client.query("COMMIT");
      console.log(`\n${updated} fiche(s) complétée(s), ${missing.length} sans texte.`);
    } else {
      console.log(
        `\nÀ blanc : ${todo.length} fiche(s) à compléter, ${missing.length} sans texte.` +
          (todo.length ? " Relancer avec --apply pour écrire." : ""),
      );
    }
  } catch (err) {
    if (apply) await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
