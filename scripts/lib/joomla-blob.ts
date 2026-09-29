/**
 * Copie de fichiers de l'ancien site Joomla (metiersdart-geneve.ch / www.) vers
 * Vercel Blob : socle partagé par scripts/migrate-images-to-blob.ts (colonnes
 * d'images en base) et scripts/sync-actu-medias.ts (fichiers des pages Actu /
 * Médias). Règles :
 *
 * - types acceptés : image/png, image/jpeg, image/gif, image/webp,
 *   application/pdf ; l'extension du fichier Blob vient du type reçu, et les
 *   premiers octets doivent correspondre au type annoncé ;
 * - réseau : seules les URL http(s) sur l'ancien site, sans identifiants ni
 *   port explicite, sont demandées. Redirections suivies à la main (5 au plus),
 *   chaque cible vérifiée AVANT d'être demandée, l'URL finale revérifiée. Une
 *   redirection vers un AUTRE chemin (image générique « pas d'image », page
 *   d'accueil) est un échec, sauf `allowRedirects` ;
 * - store Blob : identifiant lu dans BLOB_READ_WRITE_TOKEN
 *   (`vercel_blob_rw_<storeId>_<secret>`, le secret n'est jamais affiché) et
 *   confronté aux URL Blob déjà en base (`checkStore`) ;
 * - noms Blob stables (pas de suffixe aléatoire, écrasement permis) : relancer
 *   réécrit le même fichier, sans doublon.
 */
import { put } from "@vercel/blob";
import type { Client } from "pg";

/** Hôte de l'ancien site, avec ou sans www, http ou https (POSIX, insensible à la casse). */
export const OLD_HOST_SQL = "^\\s*https?://(www\\.)?metiersdart-geneve\\.ch([/:?#]|$)";
export const OLD_HOST_ANYWHERE_SQL = "https?://(www\\.)?metiersdart-geneve\\.ch";
/** Le filtre SQL est large (`…ch:x@evil.com` passe) : c'est ce contrôle qui fait foi. */
export const OLD_HOSTS = new Set(["metiersdart-geneve.ch", "www.metiersdart-geneve.ch"]);
export const BLOB_HOST_SQL = "https://([a-z0-9]+)\\.public\\.blob\\.vercel-storage\\.com";

export type Kind = "image" | "pdf";

/** Seuls types acceptés → nature et extension du fichier Blob. */
export const TYPES: Record<string, { kind: Kind; ext: string }> = {
  "image/png": { kind: "image", ext: "png" },
  "image/jpeg": { kind: "image", ext: "jpg" },
  "image/gif": { kind: "image", ext: "gif" },
  "image/webp": { kind: "image", ext: "webp" },
  "application/pdf": { kind: "pdf", ext: "pdf" },
};

export const CONCURRENCY = 4;
const CHECK_TIMEOUT_MS = 20_000;
const DOWNLOAD_TIMEOUT_MS = 120_000; // revues de presse PDF jusqu'à ~35 Mo
const MULTIPART_FROM_BYTES = 20 * 1024 * 1024;
const MAX_REDIRECTS = 5;

export interface Redirect {
  from: string;
  to: string;
  samePath: boolean;
}

export interface Outcome {
  error: string | null;
  bytes: number;
  /** URL Blob après envoi (null à la vérification ou en cas d'échec). */
  url: string | null;
  redirect?: Redirect;
}

export interface FetchOptions {
  /** Accepter une redirection vers un autre chemin (par défaut : échec). */
  allowRedirects?: boolean;
}

// ─── Utilitaires ────────────────────────────────────────────────

/** Segment de chemin sûr pour Blob : ASCII, sans accents ni espaces. */
export function safeSegment(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
}

/** Nom du fichier de l'URL, sans extension ni caractères spéciaux (« fichier » à défaut). */
export function blobStem(oldUrl: string): string {
  try {
    const last = new URL(oldUrl).pathname.split("/").filter(Boolean).pop() ?? "";
    let decoded = last;
    try {
      decoded = decodeURIComponent(last);
    } catch {
      /* segment mal encodé : gardé tel quel */
    }
    return safeSegment(decoded.replace(/\.[A-Za-z0-9]{1,5}$/, "")) || "fichier";
  } catch {
    return "fichier"; // URL invalide : signalée au téléchargement
  }
}

/** URL de l'ancien site, sinon erreur : http(s), hôte exact, ni identifiants ni port. */
export function oldSiteUrl(raw: string): URL {
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

export function typeOf(contentType: string | null) {
  const ct = (contentType ?? "").split(";")[0].trim().toLowerCase();
  return { ct, info: TYPES[ct] as (typeof TYPES)[string] | undefined };
}

/** Premiers octets cohérents avec le type annoncé (une page HTML servie en image/jpeg est refusée). */
export function magicMatches(ct: string, b: Buffer): boolean {
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

export function formatBytes(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`;
}

/** Applique `fn` à chaque élément, `limit` à la fois ; résultats dans l'ordre. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
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

export const errMsg = (err: unknown) => (err instanceof Error ? err.message : String(err));

// ─── Store Blob ─────────────────────────────────────────────────

/** `vercel_blob_rw_<storeId>_<secret>` → storeId (jamais le secret). */
export function storeIdOf(token: string | undefined): string | null {
  return token?.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)?.[1] ?? null;
}

/** Stores Blob (sous-domaines, en minuscules) déjà présents dans les colonnes données. */
export async function existingStores(
  client: Client,
  columns: readonly { table: string; column: string }[],
): Promise<string[]> {
  const stores = new Set<string>();
  for (const { table, column } of columns) {
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

/**
 * Store du jeton face à ceux déjà en base : message d'erreur si --apply doit
 * être refusé, null sinon. Affiche le constat dans tous les cas.
 */
export function checkStore(tokenStore: string | null, existing: string[], confirmed: string | undefined): string | null {
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

/** Redirection vers un autre chemin : refusée sauf allowRedirects. */
function assertRedirectAllowed(redirect: Redirect | undefined, opts: FetchOptions) {
  if (redirect && !redirect.samePath && !opts.allowRedirects) {
    throw new Error("redirigé vers un autre chemin (image générique ?) : --allow-redirects pour accepter");
  }
}

function assertAccepted(accept: readonly Kind[], contentType: string | null) {
  const { info } = typeOf(contentType);
  if (!info || !accept.includes(info.kind)) {
    throw new Error(`type ${contentType ?? "absent"} refusé (acceptés : ${accept.join(" ou ")} png/jpeg/gif/webp/pdf)`);
  }
  return info;
}

/** HEAD (repli GET si le serveur refuse HEAD) : statut, type, taille. N'écrit rien. */
export async function checkOldSiteUrl(oldUrl: string, accept: readonly Kind[], opts: FetchOptions = {}): Promise<Outcome> {
  const ctx: { redirect?: Redirect } = {};
  try {
    let res = await fetchOldSite(oldUrl, "HEAD", CHECK_TIMEOUT_MS, ctx);
    if (!res.ok) {
      ctx.redirect = undefined;
      res = await fetchOldSite(oldUrl, "GET", CHECK_TIMEOUT_MS, ctx);
      await res.body?.cancel();
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    assertRedirectAllowed(ctx.redirect, opts);
    assertAccepted(accept, res.headers.get("content-type"));
    return { error: null, bytes: Number(res.headers.get("content-length") ?? 0), url: null, redirect: ctx.redirect };
  } catch (err) {
    return { error: errMsg(err), bytes: 0, url: null, redirect: ctx.redirect };
  }
}

export interface UploadJob {
  oldUrl: string;
  /** Nom Blob sans extension (l'extension dépend du type reçu). */
  blobBase: string;
  accept: readonly Kind[];
}

/** Télécharge depuis l'ancien site puis envoie sur Blob ; renvoie l'URL Blob. */
export async function uploadFromOldSite(
  job: UploadJob,
  token: string,
  storeId: string,
  opts: FetchOptions = {},
): Promise<Outcome> {
  const ctx: { redirect?: Redirect } = {};
  try {
    const res = await fetchOldSite(job.oldUrl, "GET", DOWNLOAD_TIMEOUT_MS, ctx);
    let info;
    try {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      assertRedirectAllowed(ctx.redirect, opts);
      info = assertAccepted(job.accept, res.headers.get("content-type"));
    } catch (err) {
      await res.body?.cancel();
      throw err;
    }
    const body = Buffer.from(await res.arrayBuffer());
    if (body.length === 0) throw new Error("fichier vide");
    const { ct } = typeOf(res.headers.get("content-type"));
    if (!magicMatches(ct, body)) throw new Error(`contenu non conforme au type ${ct}`);
    const blob = await put(`${job.blobBase}.${info.ext}`, body, {
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

/** Étiquette d'une redirection pour les comptes rendus. */
export function redirectTag(redirect: Redirect, opts: FetchOptions = {}): string {
  return redirect.samePath ? "même chemin" : opts.allowRedirects ? "AUTRE CHEMIN, accepté" : "AUTRE CHEMIN, refusé";
}
