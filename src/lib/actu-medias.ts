// Actualités (/l-actu) et médias (/medias) : types publics et règles de rendu,
// sans accès à la base (testables, partagées avec l'admin et les scripts).
// La lecture (base ou repli statique) est dans db-data.ts.

import { zurichDay } from "./dates";

// ─── Actualités ─────────────────────────────────────────────────

export type PublicActu = {
  id: string;
  title: string;
  /** Étiquette rouge au-dessus du titre (« En ce moment »). */
  badge: string | null;
  /** « par … » */
  source: string | null;
  subtitle: string | null;
  description: string | null;
  eventDate: Date | null;
  eventEndDate: Date | null;
  /** Horaire libre, affiché à côté de la date (« 19h-20h30 »). */
  timeLabel: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  imageUrl: string | null;
};

const frMonth = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long" });
const frDay = (d: Date) => (d.getDate() === 1 ? "1er" : String(d.getDate()));

/**
 * Date d'une carte d'actualité : « 14 octobre », « du 19 au 21 mars 2027 »,
 * « du 30 octobre au 2 novembre », « du 30 décembre 2026 au 2 janvier 2027 ».
 * L'année n'est écrite que si elle diffère de l'année en cours (`now`).
 */
export function formatActuDate(start: Date | null, end: Date | null, now: Date = new Date()): string {
  if (!start) return "";
  const year = (d: Date) => (d.getFullYear() === now.getFullYear() ? "" : ` ${d.getFullYear()}`);
  if (!end || start.toDateString() === end.toDateString()) {
    return `${frDay(start)} ${frMonth(start)}${year(start)}`;
  }
  if (start.getFullYear() !== end.getFullYear()) {
    return `du ${frDay(start)} ${frMonth(start)} ${start.getFullYear()} au ${frDay(end)} ${frMonth(end)} ${end.getFullYear()}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `du ${frDay(start)} ${frMonth(start)} au ${frDay(end)} ${frMonth(end)}${year(end)}`;
  }
  return `du ${frDay(start)} au ${frDay(end)} ${frMonth(end)}${year(end)}`;
}

/** Libellé du lien : celui saisi, sinon « Contact » pour un mailto, « Plus d'info » ailleurs. */
export function actuLinkLabel(a: Pick<PublicActu, "linkUrl" | "linkLabel">): string {
  const label = a.linkLabel?.trim();
  if (label) return label;
  return a.linkUrl?.toLowerCase().startsWith("mailto:") ? "Contact" : "Plus d'info";
}

/** Dernier jour de l'événement (fin, sinon début) antérieur à aujourd'hui, jour civil à Genève. */
export function isActuPast(a: Pick<PublicActu, "eventDate" | "eventEndDate">, now: Date = new Date()): boolean {
  const last = a.eventEndDate ?? a.eventDate;
  return !!last && zurichDay(last) < zurichDay(now);
}

/**
 * Cartes affichées sur /l-actu, dans l'ordre de la page : d'abord les
 * actualités sans date (« En ce moment »), dans l'ordre reçu (ordre d'ajout),
 * puis les événements à venir par date croissante. Un événement dont le
 * dernier jour est passé n'est plus affiché (il reste « Publié » dans l'admin,
 * signalé « Passée »). Tri stable : à date égale, l'ordre reçu est conservé.
 */
export function visibleActualites<T extends Pick<PublicActu, "eventDate" | "eventEndDate">>(
  list: readonly T[],
  now: Date = new Date(),
): T[] {
  const key = (a: T) => (a.eventDate ? a.eventDate.getTime() : -Infinity);
  return list.filter((a) => !isActuPast(a, now)).sort((a, b) => key(a) - key(b));
}

// ─── Médias ─────────────────────────────────────────────────────

/** Sections de /medias ; l'ordre est celui du sélecteur admin. */
export const MEDIA_TYPES = [
  { value: "video", label: "Capsule vidéo" },
  { value: "interview", label: "Vidéo « On parle des métiers d'art »" },
  { value: "article", label: "Lien « On parle des métiers d'art »" },
  { value: "presse", label: "Revue de presse JEMA (PDF)" },
  { value: "archive", label: "Article archivé" },
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number]["value"];

export function isMediaType(value: unknown): value is MediaType {
  return MEDIA_TYPES.some((t) => t.value === value);
}

export function mediaTypeLabel(type: string): string {
  return MEDIA_TYPES.find((t) => t.value === type)?.label ?? type;
}

export type VideoPlatform = "vimeo" | "youtube";

export type PublicMedia = {
  id: string;
  title: string;
  type: MediaType;
  videoUrl: string | null;
  externalUrl: string | null;
  pdfUrl: string | null;
  date: Date | null;
  /** Sous-titre : domaine d'une capsule (« Art du bois »), média d'un article (« Léman Bleu »). */
  source: string | null;
  sortOrder: number;
};

export type PublicVideo = PublicMedia & { platform: VideoPlatform; videoId: string };

/**
 * Plateforme et identifiant d'une vidéo à partir de l'adresse collée dans
 * l'admin : vimeo.com/<id> (aussi player.vimeo.com/video/<id>, vimeo.com/channels/…/<id>),
 * youtube.com/watch?v=<id>, youtu.be/<id>, youtube.com/embed/<id>, youtube.com/shorts/<id>.
 * Un identifiant seul (numérique pour Vimeo, 11 caractères pour YouTube) n'est pas accepté :
 * on ne saurait pas de quelle plateforme il vient.
 */
export function parseVideoUrl(raw: unknown): { platform: VideoPlatform; videoId: string } | null {
  if (typeof raw !== "string") return null;
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const segments = u.pathname.split("/").filter(Boolean);
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = segments.find((s) => /^\d+$/.test(s));
    return id ? { platform: "vimeo", videoId: id } : null;
  }
  const yt = /^[\w-]{11}$/;
  if (host === "youtu.be") {
    const id = segments[0];
    return id && yt.test(id) ? { platform: "youtube", videoId: id } : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v && yt.test(v)) return { platform: "youtube", videoId: v };
    if ((segments[0] === "embed" || segments[0] === "shorts" || segments[0] === "v") && segments[1] && yt.test(segments[1])) {
      return { platform: "youtube", videoId: segments[1] };
    }
  }
  return null;
}

export type MediaSections = {
  /** Capsules vidéo, par ordre de tri. */
  capsules: PublicVideo[];
  /** Vidéos « On parle des métiers d'art », par ordre de tri. */
  interviews: PublicVideo[];
  /** Liens « On parle des métiers d'art », par ordre de tri. */
  links: PublicMedia[];
  /** Revues de presse JEMA, la plus récente d'abord. */
  presse: PublicMedia[];
  /** Articles archivés, le plus récent d'abord. */
  archives: PublicMedia[];
};

const bySortOrder = (a: PublicMedia, b: PublicMedia) => a.sortOrder - b.sortOrder;
/** Date décroissante, sans date en dernier ; tri stable pour le reste. */
const byDateDesc = (a: PublicMedia, b: PublicMedia) =>
  (b.date?.getTime() ?? -Infinity) - (a.date?.getTime() ?? -Infinity);

/**
 * Répartit les médias dans les sections de /medias. Un média sans l'adresse
 * dont dépend sa section (vidéo non reconnue par `parseVideoUrl`, lien ou PDF
 * absent) n'est pas affichable : ignoré. L'ordre reçu (ordre d'ajout) départage
 * les ex æquo.
 */
export function groupMedias(list: readonly PublicMedia[]): MediaSections {
  const videos = (type: MediaType): PublicVideo[] =>
    list
      .filter((m) => m.type === type)
      .flatMap((m) => {
        const v = parseVideoUrl(m.videoUrl);
        return v ? [{ ...m, ...v }] : [];
      })
      .sort(bySortOrder);
  const of = (type: MediaType, url: "externalUrl" | "pdfUrl") => list.filter((m) => m.type === type && m[url]);
  return {
    capsules: videos("video"),
    interviews: videos("interview"),
    links: of("article", "externalUrl").sort(bySortOrder),
    presse: of("presse", "pdfUrl").sort(byDateDesc),
    archives: of("archive", "externalUrl").sort(byDateDesc),
  };
}

/** Date d'un article archivé : « 14.10.2021 ». */
export function formatArchiveDate(d: Date | null): string {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}
