/**
 * Socle commun des scripts de données (migrations ciblées, reprises) :
 *
 * - `--apply` écrit ; sans lui, tout se joue dans `BEGIN TRANSACTION READ ONLY`
 *   puis ROLLBACK (jamais de SET de session : derrière le pooler Neon, il
 *   resterait sur une connexion partagée avec la prod, voir docs/FOLLOW-UP.md) ;
 * - connexion à l'endpoint DIRECT de Neon, pas au pooler (PgBouncer en mode
 *   transaction) : DATABASE_URL_UNPOOLED (Vercel), sinon POSTGRES_URL_NON_POOLING
 *   (.env.local), sinon DATABASE_URL avec `-pooler.` réécrit en `.` ;
 * - .env.local chargé si DATABASE_URL n'est pas défini ;
 * - seul l'hôte est affiché, jamais l'URL (mot de passe) ;
 * - `rollbackApplied` : retour arrière gardé d'une migration d'URL, à partir du
 *   fichier `*.applied.json` qu'elle a écrit (à blanc sans --apply).
 */
import { existsSync, readFileSync } from "node:fs";
import { Client } from "pg";

export const apply = process.argv.includes("--apply");

/** Valeur d'une option `--nom valeur` (ou `--nom=valeur`), sinon undefined. */
export function argValue(name: string): string | undefined {
  const argv = process.argv;
  const i = argv.indexOf(name);
  if (i >= 0) {
    const v = argv[i + 1];
    return v && !v.startsWith("--") ? v : undefined;
  }
  return argv.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1) || undefined;
}

/** Hôte d'une URL Postgres, sans jamais laisser l'URL fuiter dans une erreur. */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const unpool = (url: string) => url.replace("-pooler.", ".");

/** URL de l'endpoint direct (voir l'en-tête). */
function directUrl(): string {
  if (!process.env.DATABASE_URL && existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  const pooled = process.env.DATABASE_URL;
  const named = process.env.DATABASE_URL_UNPOOLED
    ? "DATABASE_URL_UNPOOLED"
    : process.env.POSTGRES_URL_NON_POOLING
      ? "POSTGRES_URL_NON_POOLING"
      : null;
  const direct = named ? process.env[named] : pooled && unpool(pooled);
  if (!direct) {
    console.error("DATABASE_URL (ou DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING) requis");
    process.exit(1);
  }
  // Garde-fou : un DATABASE_URL pointé à la main sur une autre base ne doit pas
  // être ignoré au profit d'une variable directe restée sur la prod.
  if (named && pooled) {
    const a = hostOf(unpool(pooled));
    const b = hostOf(direct);
    if (a && b && a !== b) {
      console.error(`DATABASE_URL et ${named} désignent deux bases différentes (${a} / ${b}) : abandon.`);
      process.exit(1);
    }
  }
  return direct;
}

/** Ouvre une connexion directe, exécute `fn`, ferme toujours la connexion. */
export async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: directUrl() });
  await client.connect();
  try {
    // client.host plutôt que new URL(...) : l'erreur d'une chaîne que pg
    // accepte mais que WHATWG refuse afficherait l'URL entière, mot de passe compris.
    console.log(`Base : ${client.host}`);
    return await fn(client);
  } finally {
    await client.end();
  }
}

export interface TransactionOptions {
  /** true : BEGIN … COMMIT ; false : BEGIN TRANSACTION READ ONLY … ROLLBACK. */
  write: boolean;
  /**
   * `SET LOCAL lock_timeout` (ex. "5s") : abandonner plutôt que bloquer les
   * lectures de la prod derrière un verrou. SET LOCAL ne vaut que pour la
   * transaction, donc sans risque derrière le pooler.
   */
  lockTimeout?: string;
}

/**
 * Exécute `fn` dans une transaction : COMMIT (write) ou ROLLBACK (lecture seule).
 * Toute erreur avant le COMMIT → ROLLBACK puis relance.
 */
export async function transaction<T>(
  client: Client,
  { write, lockTimeout }: TransactionOptions,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  if (lockTimeout !== undefined && !/^\d+(ms|s|min)?$/.test(lockTimeout)) {
    throw new Error(`lock_timeout invalide : ${lockTimeout}`);
  }
  await client.query(write ? "BEGIN" : "BEGIN TRANSACTION READ ONLY");
  try {
    if (lockTimeout) await client.query(`SET LOCAL lock_timeout = '${lockTimeout}'`);
    const result = await fn(client);
    await client.query(write ? "COMMIT" : "ROLLBACK");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  }
}

export interface DbScriptOptions<T> {
  /** Corps de la transaction (écriture avec --apply, lecture seule sinon). */
  run: (client: Client) => Promise<T>;
  /**
   * Après le COMMIT (--apply seulement) : compte rendu, relecture… Un échec ici
   * n'est PAS un échec de la migration (les écritures sont validées) : il est
   * affiché, le script sort en 0.
   */
  afterCommit?: (client: Client, result: T) => Promise<void> | void;
  /** Message affiché si afterCommit échoue. */
  afterCommitError?: string;
  lockTimeout?: string;
}

/** Cas courant : une connexion, une transaction, puis `afterCommit`. */
export function runDbScript<T>(opts: DbScriptOptions<T>): void {
  runMain(() =>
    withClient(async (client) => {
      const result = await transaction(
        client,
        { write: apply, lockTimeout: opts.lockTimeout },
        opts.run,
      );
      if (!apply || !opts.afterCommit) return;
      try {
        await opts.afterCommit(client, result);
      } catch (err) {
        console.error(
          opts.afterCommitError ?? "Transaction validée, mais l'étape suivante a échoué :",
          err,
        );
      }
    }),
  );
}

/** Ligne réellement modifiée par une migration (fichier `*.applied.json`). */
export interface AppliedRow {
  table: string;
  column: string;
  id: string;
  oldUrl: string;
  /** null : lien retiré (page de l'ancien site sans équivalent). */
  newUrl: string | null;
}

/**
 * Retour arrière d'une migration : pour chaque entrée de `file`,
 *   UPDATE <table> SET <column> = oldUrl WHERE id = <id> AND <column> IS NOT DISTINCT FROM newUrl
 * (newUrl null : lien retiré, la colonne doit être restée NULL) — une valeur modifiée depuis (dans l'admin) n'est jamais écrasée, elle est
 * signalée. Sans --apply : lecture seule, compte ce qui serait restauré.
 * `allowed` borne les couples table/colonne acceptés : un fichier retouché à la
 * main ne peut pas viser une autre colonne.
 */
export async function rollbackApplied(
  file: string,
  allowed: readonly { table: string; column: string }[],
): Promise<void> {
  const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
  const rows = (parsed as { rows?: unknown } | null)?.rows;
  if (!Array.isArray(rows)) throw new Error(`${file} : tableau « rows » absent`);
  const str = (v: unknown) => typeof v === "string" && v.length > 0;
  for (const [i, r] of rows.entries()) {
    const ok =
      r && typeof r === "object" && str(r.table) && str(r.column) && str(r.id) && str(r.oldUrl) &&
      (str(r.newUrl) || r.newUrl === null);
    if (!ok) throw new Error(`${file} : entrée ${i} incomplète (table, column, id, oldUrl, newUrl)`);
    if (!allowed.some((a) => a.table === r.table && a.column === r.column)) {
      throw new Error(`${file} : entrée ${i} vise ${r.table}.${r.column}, hors des colonnes de ce script`);
    }
  }
  const entries = rows as AppliedRow[];

  const { restored, skipped } = await withClient((client) =>
    transaction(client, { write: apply, lockTimeout: "5s" }, async (c) => {
      let restored = 0;
      const skipped: AppliedRow[] = [];
      for (const r of entries) {
        const tbl = c.escapeIdentifier(r.table);
        const col = c.escapeIdentifier(r.column);
        const res = apply
          ? await c.query(`UPDATE ${tbl} SET ${col} = $3 WHERE id = $1 AND ${col} IS NOT DISTINCT FROM $2`, [
              r.id,
              r.newUrl,
              r.oldUrl,
            ])
          : await c.query(`SELECT 1 FROM ${tbl} WHERE id = $1 AND ${col} IS NOT DISTINCT FROM $2`, [r.id, r.newUrl]);
        if (res.rowCount) restored++;
        else skipped.push(r);
      }
      return { restored, skipped };
    }),
  );
  for (const r of skipped) {
    console.log(`  ignorée (modifiée depuis la migration) : ${r.table}.${r.column} ${r.id}`);
  }
  console.log(
    apply
      ? `\nRetour arrière : ${restored} ligne(s) remise(s) sur l'ancienne URL, ${skipped.length} ignorée(s).`
      : `\nÀ blanc : ${restored} ligne(s) seraient remises sur l'ancienne URL, ${skipped.length} ignorée(s). ` +
          "Relancer avec --apply pour écrire.",
  );
}

/** Lance `main` ; toute erreur → message + code de sortie 1. */
export function runMain(main: () => Promise<void>): void {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
