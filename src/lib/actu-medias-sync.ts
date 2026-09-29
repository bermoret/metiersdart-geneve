// Plan de synchronisation des tables actualites / medias sur le contenu de
// référence (src/lib/actu-medias-static.ts) : logique pure, sans base, testée ;
// scripts/sync-actu-medias.ts lit les lignes, applique le plan et téléverse.
//
// Rapprochement (jamais par id : les lignes viennent d'un seed) :
// - actualité : titre (hors casse, espaces normalisés) ;
// - média : identifiant vidéo (plateforme + id, quelle que soit la section),
//   sinon année d'une revue de presse (type presse + date), sinon titre.
// Une ligne non rapprochée est dépubliée, jamais supprimée. Une ligne
// rapprochée est republiée (et désarchivée) si besoin.
//
// Fichiers de l'ancien site Joomla : une URL attendue sur metiersdart-geneve.ch
// face à une valeur en base déjà sur Vercel Blob est considérée à jour (les
// images ont été migrées le 27.09) ; face à une autre valeur, le fichier est à
// téléverser (`uploads`) et la colonne recevra l'URL Blob.

import { parseVideoUrl } from "./actu-medias";
import type { StaticActu, StaticMedia } from "./actu-medias-static";

export type ActuRow = {
  id: string;
  title: string;
  category: string | null;
  source: string | null;
  subtitle: string | null;
  excerpt: string | null;
  eventDate: Date | null;
  eventEndDate: Date | null;
  timeLabel: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  imageUrl: string | null;
  published: boolean | null;
  isArchived: boolean | null;
};

export type MediaRow = {
  id: string;
  title: string;
  type: string;
  mediaType: string | null;
  videoUrl: string | null;
  externalUrl: string | null;
  pdfUrl: string | null;
  date: Date | null;
  source: string | null;
  sortOrder: number | null;
  published: boolean | null;
};

/** Valeur prête pour SQL : texte, entier, booléen, jour « AAAA-MM-JJ » ou NULL. */
export type SqlValue = string | number | boolean | null;

export type FieldChange = { column: string; from: SqlValue; to: SqlValue };

/** Fichier de l'ancien site à copier sur Blob avant d'écrire `column`. */
export type Upload = {
  table: "actualites" | "medias";
  column: string;
  oldUrl: string;
  /** Cible : ligne existante (`id`) ou insertion (`insert`, index dans `inserts`). */
  id?: string;
  insert?: number;
  accept: ("image" | "pdf")[];
};

export type Insert = { title: string; values: Record<string, SqlValue> };
export type Update = { id: string; title: string; changes: FieldChange[] };
export type Unpublish = { id: string; title: string };

export type TablePlan = {
  inserts: Insert[];
  updates: Update[];
  unpublish: Unpublish[];
  unchanged: { id: string; title: string }[];
  uploads: Upload[];
};

// ─── Comparaisons ───────────────────────────────────────────────

export const OLD_SITE_HOSTS = new Set(["metiersdart-geneve.ch", "www.metiersdart-geneve.ch"]);

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isOldSiteUrl(url: string | null | undefined): boolean {
  const host = hostOf(url);
  return !!host && OLD_SITE_HOSTS.has(host);
}

export function isBlobUrl(url: string | null | undefined): boolean {
  const host = hostOf(url);
  return !!host && (host.endsWith(".public.blob.vercel-storage.com") || host === "vercel-blob.com");
}

/** Titre comparable : espaces normalisés, hors casse. */
export function normTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Jour local « AAAA-MM-JJ » (les timestamps sans fuseau sont relus en heure locale). */
export function localDay(d: Date | null | undefined): string | null {
  if (!d) return null;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const text = (v: string | null | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

type Kind = "text" | "day" | "bool" | "int" | "url";

type Spec<R, D> = {
  column: string;
  kind: Kind;
  current: (r: R) => SqlValue | Date | null | undefined;
  desired: (d: D) => SqlValue | Date | null | undefined;
  /** Colonnes d'URL : nature du fichier attendu si un téléversement est nécessaire. */
  accept?: ("image" | "pdf")[];
};

function normalize(kind: Kind, v: SqlValue | Date | null | undefined): SqlValue {
  if (v === undefined || v === null) return null;
  switch (kind) {
    case "day":
      return v instanceof Date ? localDay(v) : String(v);
    case "bool":
      return Boolean(v);
    case "int":
      return Number(v);
    default:
      return text(String(v));
  }
}

/**
 * Différences d'une ligne face à la valeur attendue. Pour une URL attendue sur
 * l'ancien site : valeur Blob en base → à jour ; sinon → téléversement demandé,
 * la colonne sera écrite avec l'URL Blob obtenue (`to` = ancienne URL en attendant).
 */
function diffRow<R, D>(row: R, desired: D, specs: Spec<R, D>[]): { changes: FieldChange[]; uploads: Omit<Upload, "table" | "id" | "insert">[] } {
  const changes: FieldChange[] = [];
  const uploads: Omit<Upload, "table" | "id" | "insert">[] = [];
  for (const s of specs) {
    const from = normalize(s.kind, s.current(row));
    const to = normalize(s.kind, s.desired(desired));
    if (s.kind === "url" && typeof to === "string" && isOldSiteUrl(to)) {
      if (typeof from === "string" && isBlobUrl(from)) continue; // déjà migrée
      uploads.push({ column: s.column, oldUrl: to, accept: s.accept ?? ["image", "pdf"] });
      changes.push({ column: s.column, from, to });
      continue;
    }
    if (from !== to) changes.push({ column: s.column, from, to });
  }
  return { changes, uploads };
}

/** Valeurs d'insertion (toutes les colonnes) et fichiers à téléverser. */
function insertRow<D>(desired: D, specs: Spec<never, D>[]): { values: Record<string, SqlValue>; uploads: Omit<Upload, "table" | "id" | "insert">[] } {
  const values: Record<string, SqlValue> = {};
  const uploads: Omit<Upload, "table" | "id" | "insert">[] = [];
  for (const s of specs) {
    const to = normalize(s.kind, s.desired(desired));
    values[s.column] = to;
    if (s.kind === "url" && typeof to === "string" && isOldSiteUrl(to)) {
      uploads.push({ column: s.column, oldUrl: to, accept: s.accept ?? ["image", "pdf"] });
    }
  }
  return { values, uploads };
}

function buildPlan<R extends { id: string; title: string; published: boolean | null }, D extends { title: string }>(
  table: Upload["table"],
  desiredList: readonly D[],
  rows: readonly R[],
  match: (d: D, candidates: readonly R[]) => R | undefined,
  specs: Spec<R, D>[],
): TablePlan {
  const plan: TablePlan = { inserts: [], updates: [], unpublish: [], unchanged: [], uploads: [] };
  const claimed = new Set<string>();
  for (const d of desiredList) {
    const row = match(d, rows.filter((r) => !claimed.has(r.id)));
    if (!row) {
      const { values, uploads } = insertRow(d, specs as Spec<never, D>[]);
      const index = plan.inserts.push({ title: d.title, values }) - 1;
      plan.uploads.push(...uploads.map((u) => ({ table, insert: index, ...u })));
      continue;
    }
    claimed.add(row.id);
    const { changes, uploads } = diffRow(row, d, specs);
    if (changes.length === 0) plan.unchanged.push({ id: row.id, title: row.title });
    else plan.updates.push({ id: row.id, title: row.title, changes });
    plan.uploads.push(...uploads.map((u) => ({ table, id: row.id, ...u })));
  }
  for (const r of rows) {
    if (!claimed.has(r.id) && r.published !== false) plan.unpublish.push({ id: r.id, title: r.title });
  }
  return plan;
}

// ─── Actualités ─────────────────────────────────────────────────

const ACTU_SPECS: Spec<ActuRow, StaticActu>[] = [
  { column: "title", kind: "text", current: (r) => r.title, desired: (d) => d.title },
  { column: "category", kind: "text", current: (r) => r.category, desired: (d) => d.badge },
  { column: "source", kind: "text", current: (r) => r.source, desired: (d) => d.source },
  { column: "subtitle", kind: "text", current: (r) => r.subtitle, desired: (d) => d.subtitle },
  { column: "excerpt", kind: "text", current: (r) => r.excerpt, desired: (d) => d.description },
  { column: "event_date", kind: "day", current: (r) => r.eventDate, desired: (d) => d.eventDate },
  { column: "event_end_date", kind: "day", current: (r) => r.eventEndDate, desired: (d) => d.eventEndDate },
  { column: "time_label", kind: "text", current: (r) => r.timeLabel, desired: (d) => d.timeLabel },
  { column: "link_url", kind: "text", current: (r) => r.linkUrl, desired: (d) => d.linkUrl },
  { column: "link_label", kind: "text", current: (r) => r.linkLabel, desired: (d) => d.linkLabel },
  { column: "image_url", kind: "url", accept: ["image"], current: (r) => r.imageUrl, desired: (d) => d.imageUrl },
  { column: "published", kind: "bool", current: (r) => r.published !== false, desired: () => true },
  { column: "is_archived", kind: "bool", current: (r) => r.isArchived === true, desired: () => false },
];

export function planActualites(desired: readonly StaticActu[], rows: readonly ActuRow[]): TablePlan {
  return buildPlan(
    "actualites",
    desired,
    rows,
    (d, candidates) => candidates.find((r) => normTitle(r.title) === normTitle(d.title)),
    ACTU_SPECS,
  );
}

// ─── Médias ─────────────────────────────────────────────────────

/** Clés de rapprochement d'un média, par ordre de priorité. */
export function mediaKeys(m: { type: string; title: string; videoUrl: string | null; date: Date | null }): string[] {
  const keys: string[] = [];
  const v = parseVideoUrl(m.videoUrl);
  if (v) keys.push(`video:${v.platform}:${v.videoId}`);
  if (m.type === "presse" && m.date) keys.push(`presse:${m.date.getFullYear()}`);
  keys.push(`title:${normTitle(m.title)}`);
  return keys;
}

function matchMedia(d: StaticMedia, candidates: readonly MediaRow[]): MediaRow | undefined {
  for (const key of mediaKeys(d)) {
    const row = candidates.find((r) => mediaKeys(r).includes(key));
    if (row) return row;
  }
  return undefined;
}

const MEDIA_SPECS: Spec<MediaRow, StaticMedia>[] = [
  { column: "title", kind: "text", current: (r) => r.title, desired: (d) => d.title },
  { column: "type", kind: "text", current: (r) => r.type, desired: (d) => d.type },
  {
    column: "media_type",
    kind: "text",
    current: (r) => r.mediaType,
    desired: (d) => parseVideoUrl(d.videoUrl)?.platform ?? null,
  },
  { column: "video_url", kind: "text", current: (r) => r.videoUrl, desired: (d) => d.videoUrl },
  { column: "external_url", kind: "url", accept: ["pdf", "image"], current: (r) => r.externalUrl, desired: (d) => d.externalUrl },
  { column: "pdf_url", kind: "url", accept: ["pdf"], current: (r) => r.pdfUrl, desired: (d) => d.pdfUrl },
  { column: "date", kind: "day", current: (r) => r.date, desired: (d) => d.date },
  { column: "source", kind: "text", current: (r) => r.source, desired: (d) => d.source },
  { column: "sort_order", kind: "int", current: (r) => r.sortOrder ?? 0, desired: (d) => d.sortOrder },
  { column: "published", kind: "bool", current: (r) => r.published !== false, desired: () => true },
];

export function planMedias(desired: readonly StaticMedia[], rows: readonly MediaRow[]): TablePlan {
  return buildPlan("medias", desired, rows, matchMedia, MEDIA_SPECS);
}

// ─── Affichage ──────────────────────────────────────────────────

export function formatValue(v: SqlValue): string {
  if (v === null) return "∅";
  if (typeof v === "string") return `« ${v.length > 60 ? `${v.slice(0, 57)}…` : v} »`;
  return String(v);
}

/** Lignes du compte rendu d'un plan (à blanc comme après écriture). */
export function describePlan(table: string, plan: TablePlan, rowCount: number, desiredCount: number): string[] {
  const out = [`${table} : ${rowCount} ligne(s) en base, ${desiredCount} attendue(s)`];
  for (const u of plan.unchanged) out.push(`  = ${u.title}`);
  for (const u of plan.updates) {
    out.push(`  ~ ${u.title}`);
    for (const c of u.changes) {
      const to = c.from === c.to ? "(copie sur Blob, voir ↑)" : formatValue(c.to);
      out.push(`      ${c.column} : ${formatValue(c.from)} → ${to}`);
    }
  }
  for (const i of plan.inserts) out.push(`  + ${i.title} (insertion)`);
  for (const u of plan.unpublish) out.push(`  − ${u.title} (dépublier)`);
  for (const u of plan.uploads) {
    out.push(`  ↑ ${table}.${u.column} ${u.id ?? `insertion #${(u.insert ?? 0) + 1}`} : ${u.oldUrl} → Blob`);
  }
  out.push(
    `  → ${plan.unchanged.length} inchangée(s), ${plan.updates.length} à modifier, ${plan.inserts.length} à insérer, ` +
      `${plan.unpublish.length} à dépublier, ${plan.uploads.length} fichier(s) à téléverser`,
  );
  return out;
}
