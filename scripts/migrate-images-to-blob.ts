/**
 * Rapatrie sur Vercel Blob les images (et PDF) encore servies par l'ancien site
 * Joomla (metiersdart-geneve.ch / www.), avant son arrêt.
 *
 * Colonnes migrées (hôte de l'ancien site uniquement) :
 *   artisans.image_url, actualites.image_url, partenaires.logo_url → image
 *   manufacto_editions.media_url → image ou PDF
 *   medias.pdf_url → PDF (revues de presse)
 * Types acceptés : image/png, image/jpeg, image/gif, image/webp, application/pdf
 * (SVG et autres refusés) ; l'extension du fichier Blob vient du type reçu, pas
 * du nom dans l'URL (qui peut être `index.php`), et les premiers octets doivent
 * correspondre au type annoncé.
 * Les autres colonnes qui pointent vers l'ancien site (liens, galeries JEMA en
 * jsonb, pages statiques…) sont seulement comptées : à traiter à part.
 *
 * Réseau : seules les URL http(s) sur metiersdart-geneve.ch ou
 * www.metiersdart-geneve.ch, sans identifiants ni port explicite, sont
 * demandées. Les redirections sont suivies à la main (5 au plus), chaque cible
 * vérifiée AVANT d'être demandée, l'URL finale revérifiée. Toute redirection est
 * affichée (ancienne → finale). Une redirection vers un AUTRE chemin (souvent
 * une image générique « pas d'image » ou une page d'accueil) est un échec, sauf
 * avec --allow-redirects.
 *
 * Store Blob : l'identifiant du store est lu dans BLOB_READ_WRITE_TOKEN
 * (`vercel_blob_rw_<storeId>_<secret>`, le secret n'est jamais affiché) et
 * affiché à blanc. Si la base contient déjà des URL `<store>.public.blob.
 * vercel-storage.com`, --apply exige que ce soit le même store ; sinon, --apply
 * exige `--store <storeId>` égal à celui du jeton (confirmation explicite).
 *
 * À blanc : liste par colonne (nombre + échantillon), vérifie chaque URL (HEAD,
 * repli GET ; 4 en parallèle), signale échecs et redirections. N'écrit rien.
 *
 * --apply --backup <fichier.json> :
 *   1. sauvegarde {table, column, id, key, oldUrl, blobBase} de chaque ligne
 *      visée (fichier neuf : refus s'il existe déjà) — AVANT toute écriture ;
 *   2. télécharge chaque fichier (200 + type accepté exigés) et l'envoie sur
 *      Blob sous un nom stable `migration-joomla/<table>/<slug-ou-id>-<nom>.<ext>`
 *      (pas de suffixe aléatoire, écrasement permis : relancer réécrit le même
 *      fichier, sans doublon) ;
 *   3. une seule transaction à la fin : UPDATE … WHERE id = $1 AND <col> = <ancienne URL>
 *      (une valeur modifiée entre-temps dans l'admin n'est jamais écrasée) ;
 *   4. après le COMMIT, écrit `<fichier>.applied.json` : {table, column, id,
 *      oldUrl, newUrl} des lignes RÉELLEMENT modifiées (base du retour arrière).
 * Une ligne dont le téléchargement ou l'envoi échoue est ignorée et signalée :
 * elle garde l'ancienne URL, et la relance suivante la reprend (les autres ne
 * sont plus visées). Un fichier Joomla mort ne bloque donc pas les 143 autres.
 * Après succès complet, une relance ne trouve plus rien à faire.
 *
 * updated_at n'est pas modifié : même image, autre adresse. Les pages en cache
 * (ISR, 60 s à 1 h) servent l'ancienne URL jusqu'à leur régénération : garder
 * l'ancien site en ligne au moins une heure après --apply.
 *
 * Retour arrière (à partir du fichier .applied.json, jamais de la sauvegarde) :
 *   UPDATE <table> SET <column> = <oldUrl> WHERE id = <id> AND <column> = <newUrl>
 * ce que fait --rollback (à blanc sans --apply ; les fichiers Blob restent).
 *
 * Usage :
 *   npx tsx scripts/migrate-images-to-blob.ts                                  → à blanc
 *   npx tsx scripts/migrate-images-to-blob.ts --apply --backup <f.json> [--store <id>] [--allow-redirects]
 *   npx tsx scripts/migrate-images-to-blob.ts --rollback <f.applied.json> [--apply]
 * Base : endpoint direct de Neon (scripts/lib/db-script.ts) ; Blob : BLOB_READ_WRITE_TOKEN
 * (.env.local, lu si DATABASE_URL absent).
 */
import { existsSync, writeFileSync } from "node:fs";
import { put } from "@vercel/blob";
import type { Client } from "pg";
import {
  apply,
  argValue,
  rollbackApplied,
  runMain,
  transaction,
  withClient,
  type AppliedRow,
} from "./lib/db-script";

/** Hôte de l'ancien site, avec ou sans www, http ou https (POSIX, insensible à la casse). */
const OLD_HOST_SQL = "^\\s*https?://(www\\.)?metiersdart-geneve\\.ch([/:?#]|$)";
const OLD_HOST_ANYWHERE_SQL = "https?://(www\\.)?metiersdart-geneve\\.ch";
/** Le filtre SQL est large (`…ch:x@evil.com` passe) : c'est ce contrôle qui fait foi. */
const OLD_HOSTS = new Set(["metiersdart-geneve.ch", "www.metiersdart-geneve.ch"]);
const BLOB_HOST_SQL = "https://([a-z0-9]+)\\.public\\.blob\\.vercel-storage\\.com";

type Kind = "image" | "pdf";
interface Target {
  table: string;
  column: string;
  /** Colonne qui nomme le fichier sur Blob (slug si stable et lisible, sinon id). */
  key: "slug" | "id";
  accept: Kind[];
}

const TARGETS: Target[] = [
  { table: "artisans", column: "image_url", key: "slug", accept: ["image"] },
  { table: "actualites", column: "image_url", key: "id", accept: ["image"] },
  { table: "partenaires", column: "logo_url", key: "id", accept: ["image"] },
  { table: "manufacto_editions", column: "media_url", key: "id", accept: ["image", "pdf"] },
  { table: "medias", column: "pdf_url", key: "id", accept: ["pdf"] },
];

/** Colonnes où chercher des URL Blob existantes (store déjà utilisé), en plus des cibles. */
const BLOB_SCAN_EXTRA = [
  { table: "artisans", column: "gallery_images" },
  { table: "jema_editions", column: "gallery_images" },
  { table: "jema_editions", column: "program_url" },
];

/** Seuls types acceptés → nature et extension du fichier Blob. */
const TYPES: Record<string, { kind: Kind; ext: string }> = {
  "image/png": { kind: "image", ext: "png" },
  "image/jpeg": { kind: "image", ext: "jpg" },
  "image/gif": { kind: "image", ext: "gif" },
  "image/webp": { kind: "image", ext: "webp" },
  "application/pdf": { kind: "pdf", ext: "pdf" },
};

const CONCURRENCY = 4;
const CHECK_TIMEOUT_MS = 20_000;
const DOWNLOAD_TIMEOUT_MS = 120_000; // revues de presse PDF jusqu'à ~35 Mo
const MULTIPART_FROM_BYTES = 20 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const allowRedirects = process.argv.includes("--allow-redirects");

interface Row {
  target: Target;
  id: string;
  key: string;
  oldUrl: string;
  /** Nom Blob sans extension (l'extension dépend du type reçu). */
  blobBase: string;
}

interface Redirect {
  from: string;
  to: string;
  samePath: boolean;
}

// ─── Utilitaires ────────────────────────────────────────────────

/** Segment de chemin sûr pour Blob : ASCII, sans accents ni espaces. */
function safeSegment(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
}

function blobBase(t: Target, key: string, oldUrl: string): string {
  let stem = "fichier";
  try {
    const last = new URL(oldUrl).pathname.split("/").filter(Boolean).pop() ?? "";
    let decoded = last;
    try {
      decoded = decodeURIComponent(last);
    } catch {
      /* segment mal encodé : gardé tel quel */
    }
    stem = safeSegment(decoded.replace(/\.[A-Za-z0-9]{1,5}$/, "")) || stem;
  } catch {
    /* URL invalide : signalée au téléchargement */
  }
  return `migration-joomla/${t.table}/${safeSegment(key)}-${stem}`;
}

/** URL de l'ancien site, sinon erreur : http(s), hôte exact, ni identifiants ni port. */
function oldSiteUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("URL invalide");
  }
  const ok =
    (u.protocol === "http:" || u.protocol === "https:") &&
    OLD_HOSTS.has(u.hostname) &&
    u.username === "" &&
    u.password === "" &&
    u.port === ""; // port par défaut : WHATWG le vide
  if (!ok) throw new Error(`URL hors de l'ancien site refusée : ${u.protocol}//${u.host}${u.pathname}`);
  return u;
}

function typeOf(contentType: string | null) {
  const ct = (contentType ?? "").split(";")[0].trim().toLowerCase();
  return { ct, info: TYPES[ct] as (typeof TYPES)[string] | undefined };
}

/** Premiers octets cohérents avec le type annoncé (une page HTML servie en image/jpeg est refusée). */
function magicMatches(ct: string, b: Buffer): boolean {
  switch (ct) {
    case "image/png":
      return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/gif":
      return b.subarray(0, 4).toString("latin1") === "GIF8";
    case "image/webp":
      return b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP";
    case "application/pdf":
      return b.subarray(0, 1024).toString("latin1").includes("%PDF-");
    default:
      return false;
  }
}

function formatBytes(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`;
}

/** Applique `fn` à chaque élément, `limit` à la fois ; résultats dans l'ordre. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const errMsg = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** `vercel_blob_rw_<storeId>_<secret>` → storeId (jamais le secret). */
function storeIdOf(token: string | undefined): string | null {
  return token?.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)?.[1] ?? null;
}

// ─── Lecture ────────────────────────────────────────────────────

async function readRows(client: Client): Promise<Row[]> {
  const rows: Row[] = [];
  for (const t of TARGETS) {
    const tbl = client.escapeIdentifier(t.table);
    const col = client.escapeIdentifier(t.column);
    const key = client.escapeIdentifier(t.key);
    const res = await client.query<{ id: string; key: string; url: string }>(
      `SELECT id::text AS id, ${key}::text AS key, ${col} AS url FROM ${tbl}
        WHERE ${col} ~* $1 ORDER BY ${key}`,
      [OLD_HOST_SQL],
    );
    for (const r of res.rows) {
      rows.push({ target: t, id: r.id, key: r.key, oldUrl: r.url, blobBase: blobBase(t, r.key, r.url.trim()) });
    }
  }
  return rows;
}

/** Autres colonnes texte / jsonb qui mentionnent une URL de l'ancien site (comptage seul). */
async function otherColumns(client: Client): Promise<{ where: string; count: number }[]> {
  const { rows: cols } = await client.query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND data_type IN ('text', 'character varying', 'jsonb', 'json')
      ORDER BY table_name, column_name`,
  );
  const found: { where: string; count: number }[] = [];
  for (const c of cols) {
    if (TARGETS.some((t) => t.table === c.table_name && t.column === c.column_name)) continue;
    const { rows } = await client.query<{ n: string }>(
      `SELECT count(*) AS n FROM ${client.escapeIdentifier(c.table_name)}
        WHERE ${client.escapeIdentifier(c.column_name)}::text ~* $1`,
      [OLD_HOST_ANYWHERE_SQL],
    );
    const n = Number(rows[0].n);
    if (n > 0) found.push({ where: `${c.table_name}.${c.column_name}`, count: n });
  }
  return found;
}

/** Stores Blob (sous-domaines, en minuscules) déjà présents dans les colonnes d'images. */
async function existingStores(client: Client): Promise<string[]> {
  const stores = new Set<string>();
  for (const { table, column } of [...TARGETS, ...BLOB_SCAN_EXTRA]) {
    const { rows } = await client.query<{ store: string }>(
      `SELECT DISTINCT lower(m[1]) AS store
         FROM ${client.escapeIdentifier(table)},
              regexp_matches(${client.escapeIdentifier(column)}::text, $1, 'gi') AS m`,
      [BLOB_HOST_SQL],
    );
    for (const r of rows) stores.add(r.store);
  }
  return [...stores].sort();
}

function report(rows: Row[], others: { where: string; count: number }[]) {
  for (const t of TARGETS) {
    const mine = rows.filter((r) => r.target === t);
    console.log(`\n${t.table}.${t.column} : ${mine.length} URL(s) sur l'ancien site`);
    for (const r of mine.slice(0, 5)) console.log(`  ${r.key} — ${r.oldUrl}`);
    if (mine.length > 5) console.log(`  … et ${mine.length - 5} autre(s)`);
  }
  if (others.length) {
    console.log("\nAutres colonnes pointant vers l'ancien site (NON migrées, à traiter à part) :");
    for (const o of others) console.log(`  ${o.where} : ${o.count} ligne(s)`);
  } else {
    console.log("\nAucune autre colonne ne pointe vers l'ancien site.");
  }
}

/**
 * Store du jeton face à ceux déjà en base : message d'erreur si --apply doit
 * être refusé, null sinon. Affiche le constat dans tous les cas.
 */
function checkStore(tokenStore: string | null, existing: string[], confirmed: string | undefined): string | null {
  console.log(`\nStore Blob du jeton : ${tokenStore ?? "(jeton absent ou illisible)"}`);
  console.log(`Stores Blob déjà en base : ${existing.length ? existing.join(", ") : "aucun"}`);
  if (!tokenStore) return "BLOB_READ_WRITE_TOKEN absent ou au format inattendu (vercel_blob_rw_<store>_…)";
  const mine = tokenStore.toLowerCase();
  const foreign = existing.filter((s) => s !== mine);
  if (foreign.length) {
    return `la base utilise déjà le(s) store(s) ${foreign.join(", ")}, le jeton vise ${tokenStore} : mauvais jeton ?`;
  }
  if (existing.length === 0 && confirmed?.toLowerCase() !== mine) {
    return `aucune URL Blob en base pour confirmer le store : relancer avec --store ${tokenStore} si c'est bien le bon`;
  }
  if (confirmed !== undefined && confirmed.toLowerCase() !== mine) {
    return `--store ${confirmed} ne correspond pas au jeton (${tokenStore})`;
  }
  return null;
}

// ─── Réseau ─────────────────────────────────────────────────────

/**
 * GET/HEAD sur l'ancien site, redirections suivies à la main : chaque cible est
 * contrôlée avant d'être demandée, l'URL finale revérifiée. `ctx.redirect`
 * reçoit la redirection éventuelle (même en cas d'échec ensuite).
 */
async function fetchOldSite(
  raw: string,
  method: "GET" | "HEAD",
  timeoutMs: number,
  ctx: { redirect?: Redirect },
): Promise<Response> {
  const start = oldSiteUrl(raw);
  let current = start;
  const signal = AbortSignal.timeout(timeoutMs);
  for (let hop = 0; ; hop++) {
    const res = await fetch(current, { method, redirect: "manual", signal });
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) {
      const final = oldSiteUrl(res.url || current.href);
      if (hop > 0) ctx.redirect = { from: start.href, to: final.href, samePath: final.pathname === start.pathname };
      return res;
    }
    await res.body?.cancel();
    if (hop >= MAX_REDIRECTS) throw new Error(`plus de ${MAX_REDIRECTS} redirections`);
    current = oldSiteUrl(new URL(location, current).href);
  }
}

/** Redirection vers un autre chemin : refusée sauf --allow-redirects. */
function assertRedirectAllowed(redirect: Redirect | undefined) {
  if (redirect && !redirect.samePath && !allowRedirects) {
    throw new Error("redirigé vers un autre chemin (image générique ?) : --allow-redirects pour accepter");
  }
}

function assertAccepted(row: Row, contentType: string | null) {
  const { info } = typeOf(contentType);
  if (!info || !row.target.accept.includes(info.kind)) {
    throw new Error(`type ${contentType ?? "absent"} refusé (acceptés : ${row.target.accept.join(" ou ")} png/jpeg/gif/webp/pdf)`);
  }
  return info;
}

interface Outcome {
  error: string | null;
  bytes: number;
  url: string | null;
  redirect?: Redirect;
}

/** HEAD (repli GET si le serveur refuse HEAD) : statut, type, taille. */
async function checkUrl(row: Row): Promise<Outcome> {
  const ctx: { redirect?: Redirect } = {};
  try {
    let res = await fetchOldSite(row.oldUrl, "HEAD", CHECK_TIMEOUT_MS, ctx);
    if (!res.ok) {
      ctx.redirect = undefined;
      res = await fetchOldSite(row.oldUrl, "GET", CHECK_TIMEOUT_MS, ctx);
      await res.body?.cancel();
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    assertRedirectAllowed(ctx.redirect);
    assertAccepted(row, res.headers.get("content-type"));
    return { error: null, bytes: Number(res.headers.get("content-length") ?? 0), url: null, redirect: ctx.redirect };
  } catch (err) {
    return { error: errMsg(err), bytes: 0, url: null, redirect: ctx.redirect };
  }
}

/** Télécharge puis envoie sur Blob ; renvoie l'URL Blob. */
async function migrateOne(row: Row, token: string, storeId: string): Promise<Outcome> {
  const ctx: { redirect?: Redirect } = {};
  try {
    const res = await fetchOldSite(row.oldUrl, "GET", DOWNLOAD_TIMEOUT_MS, ctx);
    let info;
    try {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      assertRedirectAllowed(ctx.redirect);
      info = assertAccepted(row, res.headers.get("content-type"));
    } catch (err) {
      await res.body?.cancel();
      throw err;
    }
    const body = Buffer.from(await res.arrayBuffer());
    if (body.length === 0) throw new Error("fichier vide");
    const { ct } = typeOf(res.headers.get("content-type"));
    if (!magicMatches(ct, body)) throw new Error(`contenu non conforme au type ${ct}`);
    const blob = await put(`${row.blobBase}.${info.ext}`, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: ct,
      multipart: body.length >= MULTIPART_FROM_BYTES,
      token,
    });
    // Garde-fou : l'URL rendue doit être sur le store du jeton.
    if (new URL(blob.url).hostname.toLowerCase() !== `${storeId.toLowerCase()}.public.blob.vercel-storage.com`) {
      throw new Error(`Blob rendu hors du store ${storeId} : ${blob.url}`);
    }
    return { error: null, bytes: body.length, url: blob.url, redirect: ctx.redirect };
  } catch (err) {
    return { error: errMsg(err), bytes: 0, url: null, redirect: ctx.redirect };
  }
}

function reportRedirects(rows: Row[], outcomes: Outcome[]) {
  const redirected = rows.map((r, i) => ({ r, o: outcomes[i] })).filter(({ o }) => o.redirect);
  if (!redirected.length) return;
  console.log(`\nRedirections (${redirected.length}) :`);
  for (const { r, o } of redirected) {
    const d = o.redirect!;
    const tag = d.samePath ? "même chemin" : allowRedirects ? "AUTRE CHEMIN, accepté" : "AUTRE CHEMIN, refusé";
    console.log(`  [${tag}] ${r.target.table} ${r.key} — ${d.from} → ${d.to}`);
  }
}

// ─── Programme ──────────────────────────────────────────────────

async function main() {
  const rollbackPath = argValue("--rollback");
  if (process.argv.includes("--rollback")) {
    if (!rollbackPath) {
      console.error("--rollback exige un fichier <…>.applied.json : rien fait.");
      process.exit(1);
    }
    await rollbackApplied(rollbackPath, TARGETS);
    return;
  }

  const backupPath = argValue("--backup");
  const appliedPath = backupPath && `${backupPath.replace(/\.json$/i, "")}.applied.json`;
  if (apply) {
    if (!backupPath || !appliedPath) {
      console.error("--apply exige --backup <fichier.json> (sauvegarde des anciennes URL) : rien fait.");
      process.exit(1);
    }
    for (const f of [backupPath, appliedPath]) {
      if (existsSync(f)) {
        console.error(`${f} existe déjà : choisir un nouveau fichier (jamais écrasé). Rien fait.`);
        process.exit(1);
      }
    }
  }

  // 1. Lecture seule, connexion refermée avant le réseau (plusieurs minutes).
  const { rows, others, stores } = await withClient((client) =>
    transaction(client, { write: false }, async (c) => ({
      rows: await readRows(c),
      others: await otherColumns(c),
      stores: await existingStores(c),
    })),
  );
  report(rows, others);

  // Deux lignes vers le même nom Blob s'écraseraient : impossible (slug / id
  // uniques par table), mais vérifié plutôt que supposé.
  const seen = new Map<string, Row>();
  for (const r of rows) {
    const prev = seen.get(r.blobBase);
    if (prev && prev.oldUrl !== r.oldUrl) {
      throw new Error(`Nom Blob en double : ${r.blobBase} (${prev.target.table} ${prev.id} / ${r.target.table} ${r.id})`);
    }
    seen.set(r.blobBase, r);
  }

  // .env.local est chargé par withClient : jeton lisible seulement maintenant.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = storeIdOf(token);
  const storeError = checkStore(storeId, stores, argValue("--store"));

  if (rows.length === 0) {
    console.log("\nRien à migrer.");
    return;
  }

  if (!apply) {
    console.log(`\nVérification de ${rows.length} URL(s)…`);
    const checks = await mapLimit(rows, CONCURRENCY, checkUrl);
    const failed = rows.map((r, i) => ({ r, c: checks[i] })).filter(({ c }) => c.error);
    const bytes = checks.reduce((s, c) => s + c.bytes, 0);
    for (const { r, c } of failed) console.log(`  ÉCHEC ${r.target.table} ${r.key} — ${c.error} — ${r.oldUrl}`);
    reportRedirects(rows, checks);
    const redirected = checks.filter((c) => c.redirect).length;
    console.log(
      `\nÀ blanc : ${rows.length - failed.length} fichier(s) migrable(s) (~${formatBytes(bytes)}), ` +
        `${failed.length} en échec${redirected ? `, ${redirected} redirigé(s)` : ""}.`,
    );
    console.log(`Exemple de nom Blob : ${rows[0].blobBase}.<ext du type reçu>`);
    console.log(storeError ? `--apply serait refusé : ${storeError}.` : "Store Blob : OK pour --apply.");
    console.log("Relancer avec --apply --backup <fichier.json> [--store <storeId>] pour migrer.");
    return;
  }

  if (storeError || !token || !storeId) {
    console.error(`Store Blob : ${storeError ?? "jeton absent"}. Rien fait.`);
    process.exit(1);
  }

  // 2. Sauvegarde AVANT toute écriture (Blob compris) ; 'wx' : jamais d'écrasement.
  const backup = rows.map((r) => ({
    table: r.target.table,
    column: r.target.column,
    id: r.id,
    key: r.key,
    oldUrl: r.oldUrl,
    blobBase: r.blobBase,
  }));
  writeFileSync(backupPath!, JSON.stringify({ createdAt: new Date().toISOString(), storeId, rows: backup }, null, 2), {
    flag: "wx",
  });
  console.log(`\nSauvegarde : ${backup.length} ligne(s) dans ${backupPath}`);

  // 3. Téléchargements et envois.
  console.log(`Migration de ${rows.length} fichier(s)…`);
  let done = 0;
  const outcomes = await mapLimit(rows, CONCURRENCY, async (r) => {
    const o = await migrateOne(r, token, storeId);
    if (!o.error && ++done % 20 === 0) console.log(`  ${done}/${rows.length}`);
    return o;
  });
  const results = rows.map((r, i) => ({ r, ...outcomes[i] }));
  const uploaded = results.filter((x): x is typeof x & { url: string } => x.url !== null);
  const failed = results.filter((x) => x.error !== null);
  for (const f of failed) console.log(`  ÉCHEC ${f.r.target.table} ${f.r.key} — ${f.error} — ${f.r.oldUrl}`);
  reportRedirects(rows, outcomes);
  console.log(
    `Envoyés sur Blob : ${uploaded.length} (${formatBytes(uploaded.reduce((s, x) => s + x.bytes, 0))}), en échec : ${failed.length}.`,
  );

  // 4. Une transaction pour toutes les URL ; une valeur changée entre-temps
  //    n'est pas écrasée (le fichier Blob correspondant reste orphelin, signalé).
  if (uploaded.length) {
    const { applied, kept } = await withClient((client) =>
      transaction(client, { write: true, lockTimeout: "5s" }, async (c) => {
        const applied: AppliedRow[] = [];
        const kept: typeof uploaded = [];
        for (const x of uploaded) {
          const t = x.r.target;
          const col = c.escapeIdentifier(t.column);
          const res = await c.query(
            `UPDATE ${c.escapeIdentifier(t.table)} SET ${col} = $3 WHERE id = $1 AND ${col} = $2`,
            [x.r.id, x.r.oldUrl, x.url],
          );
          if (res.rowCount === 1) {
            applied.push({ table: t.table, column: t.column, id: x.r.id, oldUrl: x.r.oldUrl, newUrl: x.url });
          } else {
            kept.push(x);
          }
        }
        return { applied, kept };
      }),
    );
    // Transaction validée : la suite n'est qu'un compte rendu.
    const appliedJson = JSON.stringify({ createdAt: new Date().toISOString(), storeId, rows: applied }, null, 2);
    try {
      writeFileSync(appliedPath!, appliedJson, { flag: "wx" });
      console.log(`\nLignes modifiées (base du retour arrière) : ${applied.length} dans ${appliedPath}`);
    } catch (err) {
      console.error(`\nÉcriture de ${appliedPath} impossible (${errMsg(err)}) : contenu à conserver ci-dessous.`);
      console.log(appliedJson);
    }
    for (const x of kept) {
      console.log(`  inchangée (modifiée entre-temps) : ${x.r.target.table} ${x.r.key} — Blob orphelin ${x.url}`);
    }
    console.log(`Base mise à jour : ${applied.length} ligne(s), ${kept.length} inchangée(s).`);
  }

  if (failed.length) {
    console.log(`\nMigration partielle : ${failed.length} ligne(s) restée(s) sur l'ancien site. Relancer pour les reprendre.`);
    process.exitCode = 1;
  } else {
    console.log("\nMigration terminée. Une relance à blanc doit afficher « Rien à migrer » pour ces colonnes.");
  }
}

runMain(main);
