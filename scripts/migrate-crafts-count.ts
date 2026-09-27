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
 * Connexion à l'endpoint direct de Neon (DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING
 * ou DATABASE_URL sans `-pooler`, .env.local lu si DATABASE_URL absent) : scripts/lib/db-script.ts.
 */
import { apply, runDbScript } from "./lib/db-script";

const INITIAL_CRAFTS_COUNT = 53;

runDbScript({
  // L'ALTER prend un verrou exclusif : abandonner après 5 s plutôt que bloquer
  // toutes les lectures de site_settings derrière lui.
  lockTimeout: "5s",
  async run(client) {
    // to_regclass résout site_settings par le search_path, comme les requêtes
    // ci-dessous (current_schema() ne regarde que le premier schéma existant).
    const { rows: cols } = await client.query(
      `SELECT 1 FROM pg_attribute
        WHERE attrelid = to_regclass('site_settings') AND attname = 'crafts_count'
          AND NOT attisdropped`,
    );
    const exists = cols.length > 0;
    console.log(`Colonne crafts_count : ${exists ? "déjà présente" : "absente"}`);

    if (!apply) {
      const { rows } = await client.query(
        `SELECT events_count${exists ? ", crafts_count" : ""} FROM site_settings WHERE id = 'default'`,
      );
      console.log(`Ligne « default » : ${rows[0] ? JSON.stringify(rows[0]) : "absente (rien à initialiser)"}`);
      console.log(
        `À blanc : ${exists ? "" : "ALTER TABLE site_settings ADD COLUMN crafts_count integer ; "}` +
          `crafts_count = ${INITIAL_CRAFTS_COUNT} si vide. Relancer avec --apply pour écrire.`,
      );
      return 0;
    }

    await client.query("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS crafts_count integer");
    const res = await client.query(
      `UPDATE site_settings SET crafts_count = $1, updated_at = now()
        WHERE id = 'default' AND crafts_count IS NULL`,
      [INITIAL_CRAFTS_COUNT],
    );
    return res.rowCount ?? 0;
  },
  // Après le COMMIT, seule la relecture peut échouer : la migration est faite.
  async afterCommit(client, initialized) {
    console.log(`Appliqué : ${initialized} ligne(s) initialisée(s).`);
    const { rows } = await client.query(
      "SELECT events_count, crafts_count FROM site_settings WHERE id = 'default'",
    );
    console.log("État :", rows[0]);
  },
  afterCommitError: "Migration appliquée, mais relecture de l'état impossible :",
});
