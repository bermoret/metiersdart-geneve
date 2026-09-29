/**
 * Migration : colonnes du branchement de /l-actu et /medias sur la base
 * (l'admin Actualités / Médias devient la source des deux pages).
 *
 *   actualites.source      varchar(255)  « par … »
 *   actualites.subtitle    varchar(255)  ligne sous le titre
 *   actualites.time_label  varchar(100)  horaire libre (« 19h-20h30 »)
 *   actualites.link_label  varchar(100)  libellé du lien (« Plus d'info », « Contact »)
 *   medias.published       boolean DEFAULT true  (les lignes existantes restent visibles)
 *
 * SQL ciblé plutôt que `drizzle-kit push` (faux positif sur les clés des tables
 * d'auth, voir docs/FOLLOW-UP.md) ; les colonnes sont déclarées dans
 * src/db/schema.ts. Idempotent : ADD COLUMN IF NOT EXISTS, aucune valeur
 * existante modifiée. Aucune colonne n'est supprimée (content, category_id,
 * description restent, non affichées).
 *
 * À appliquer AVANT de déployer le code qui lit ces colonnes, puis lancer
 * scripts/sync-actu-medias.ts pour aligner le contenu sur les pages actuelles.
 *
 * Usage :
 *   npx tsx scripts/migrate-actu-medias.ts          → à blanc (transaction en lecture seule)
 *   npx tsx scripts/migrate-actu-medias.ts --apply  → écrit, en une transaction
 * Connexion à l'endpoint direct de Neon (DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING
 * ou DATABASE_URL sans `-pooler`, .env.local lu si DATABASE_URL absent) : scripts/lib/db-script.ts.
 */
import type { Client } from "pg";
import { apply, runDbScript } from "./lib/db-script";

const COLUMNS: { table: string; column: string; ddl: string }[] = [
  { table: "actualites", column: "source", ddl: "varchar(255)" },
  { table: "actualites", column: "subtitle", ddl: "varchar(255)" },
  { table: "actualites", column: "time_label", ddl: "varchar(100)" },
  { table: "actualites", column: "link_label", ddl: "varchar(100)" },
  { table: "medias", column: "published", ddl: "boolean DEFAULT true" },
];

/** Colonnes de la liste absentes de la base (to_regclass suit le search_path, comme les requêtes). */
async function missingColumns(client: Client): Promise<typeof COLUMNS> {
  const missing: typeof COLUMNS = [];
  for (const c of COLUMNS) {
    const { rows } = await client.query(
      `SELECT 1 FROM pg_attribute
        WHERE attrelid = to_regclass($1) AND attname = $2 AND NOT attisdropped`,
      [c.table, c.column],
    );
    if (rows.length === 0) missing.push(c);
  }
  return missing;
}

runDbScript({
  // Chaque ALTER prend un verrou exclusif : abandonner après 5 s plutôt que
  // bloquer les lectures des pages derrière lui.
  lockTimeout: "5s",
  async run(client) {
    const missing = await missingColumns(client);
    for (const c of COLUMNS) {
      const absent = missing.includes(c);
      console.log(`${c.table}.${c.column} : ${absent ? "absente" : "déjà présente"}`);
    }
    if (missing.length === 0) {
      console.log("Rien à faire : toutes les colonnes existent.");
      return 0;
    }
    if (!apply) {
      console.log("À blanc :");
      for (const c of missing) {
        console.log(`  ALTER TABLE ${c.table} ADD COLUMN IF NOT EXISTS ${c.column} ${c.ddl};`);
      }
      console.log("Relancer avec --apply pour écrire.");
      return 0;
    }
    for (const c of missing) {
      // Identifiants tirés de la liste ci-dessus, pas d'une saisie.
      await client.query(
        `ALTER TABLE ${client.escapeIdentifier(c.table)} ADD COLUMN IF NOT EXISTS ${client.escapeIdentifier(c.column)} ${c.ddl}`,
      );
    }
    return missing.length;
  },
  async afterCommit(client, added) {
    console.log(`Appliqué : ${added} colonne(s) ajoutée(s).`);
    const still = await missingColumns(client);
    console.log(still.length ? `Encore absentes : ${still.map((c) => `${c.table}.${c.column}`).join(", ")}` : "État : toutes les colonnes présentes.");
  },
  afterCommitError: "Migration appliquée, mais relecture de l'état impossible :",
});
