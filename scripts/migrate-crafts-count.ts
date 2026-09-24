/**
 * Migration : colonne `site_settings.crafts_count` (« Métiers » de MAG en
 * chiffres, saisi dans l'admin), initialisée à 53 (tableau Stat_GLOBALES de
 * MAG, 01.09.2026 — valeur affichée jusqu'ici en dur sur l'accueil).
 *
 * SQL ciblé plutôt que `drizzle-kit push` (faux positif sur les clés des tables
 * d'auth, voir docs/FOLLOW-UP.md) ; la colonne est déclarée dans src/db/schema.ts.
 * Idempotent : ADD COLUMN IF NOT EXISTS, et la valeur n'est posée que si la
 * colonne est vide (une saisie admin n'est jamais écrasée).
 *
 * À appliquer AVANT de déployer le code qui lit la colonne.
 *
 * Usage :
 *   npx tsx scripts/migrate-crafts-count.ts          → à blanc (transaction en lecture seule)
 *   npx tsx scripts/migrate-crafts-count.ts --apply  → écrit, en une transaction
 * (DATABASE_URL, sinon lu dans .env.local)
 */
import { existsSync } from "node:fs";
import { Client } from "pg";

const INITIAL_CRAFTS_COUNT = 53;
const apply = process.argv.includes("--apply");

if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log(`Base : ${new URL(process.env.DATABASE_URL!).hostname}`);
  try {
    // À blanc : transaction READ ONLY, puis ROLLBACK. Pas de SET de session :
    // derrière le pooler Neon, il resterait sur une connexion partagée avec la prod.
    await client.query(apply ? "BEGIN" : "BEGIN TRANSACTION READ ONLY");

    const { rows: cols } = await client.query(
      `SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'site_settings'
          AND column_name = 'crafts_count'`,
    );
    const exists = cols.length > 0;
    console.log(`Colonne crafts_count : ${exists ? "déjà présente" : "absente"}`);

    if (!apply) {
      const { rows } = await client.query(
        `SELECT events_count${exists ? ", crafts_count" : ""} FROM site_settings WHERE id = 'default'`,
      );
      await client.query("ROLLBACK");
      console.log(`Ligne « default » : ${rows[0] ? JSON.stringify(rows[0]) : "absente (rien à initialiser)"}`);
      console.log(
        `À blanc : ${exists ? "" : "ALTER TABLE site_settings ADD COLUMN crafts_count integer ; "}` +
          `crafts_count = ${INITIAL_CRAFTS_COUNT} si vide. Relancer avec --apply pour écrire.`,
      );
      return;
    }

    await client.query("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS crafts_count integer");
    const res = await client.query(
      `UPDATE site_settings SET crafts_count = $1, updated_at = now()
        WHERE id = 'default' AND crafts_count IS NULL`,
      [INITIAL_CRAFTS_COUNT],
    );
    await client.query("COMMIT");
    const { rows } = await client.query(
      "SELECT events_count, crafts_count FROM site_settings WHERE id = 'default'",
    );
    console.log(`Appliqué : ${res.rowCount ?? 0} ligne(s) initialisée(s). État :`, rows[0]);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
