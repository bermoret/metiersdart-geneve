// Corps des POST / PATCH admin des actualités et des médias → valeurs à écrire.
// Fonctions pures (sans base), testées : la validation est la même à la
// création et à la modification. En modification, seuls les champs envoyés
// figurent dans le résultat (undefined = non modifié) ; une chaîne vide ou
// null vide le champ. Les liens finissent dans des href publics : http(s)
// seulement (mailto: et chemin du site tolérés pour le lien d'une actualité).

import { isMediaType, parseVideoUrl, type MediaType } from "./actu-medias";
import { isHttpUrl, isPublicHref } from "./url";

type Mode = "create" | "patch";

class InputError extends Error {}

const fail = (message: string): never => {
  throw new InputError(message);
};

/**
 * Texte optionnel : absent → undefined ; vide / null → null ; sinon la chaîne
 * nettoyée, bornée à `max` caractères (colonnes varchar).
 */
function optText(input: Record<string, unknown>, key: string, label: string, max: number): string | null | undefined {
  const raw = input[key];
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== "string") return fail(`${label} : texte attendu`);
  const value = raw.trim();
  if (!value) return null;
  if (value.length > max) return fail(`${label} : ${max} caractères au plus`);
  return value;
}

/**
 * Date « AAAA-MM-JJ » (champ date de l'admin) ou ISO ; absent → undefined ;
 * vide → null. Comme les autres routes admin (JEMA) : `new Date("AAAA-MM-JJ")`,
 * minuit UTC — le serveur (Vercel) est en UTC, la colonne est sans fuseau, et le
 * formulaire relit `toISOString().slice(0, 10)`.
 */
function optDate(input: Record<string, unknown>, key: string, label: string): Date | null | undefined {
  const raw = input[key];
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  if (typeof raw !== "string") return fail(`${label} : date attendue`);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return fail(`${label} : date invalide`);
  return d;
}

function optBool(input: Record<string, unknown>, key: string, label: string): boolean | undefined {
  const raw = input[key];
  if (raw === undefined) return undefined;
  if (typeof raw !== "boolean") return fail(`${label} : oui / non attendu`);
  return raw;
}

function asObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Requête invalide");
  return body as Record<string, unknown>;
}

/** Titre : obligatoire à la création, non vide s'il est envoyé. */
function title(input: Record<string, unknown>, mode: Mode): string | undefined {
  const value = optText(input, "title", "Le titre", 500);
  if (value === undefined && mode === "patch") return undefined;
  if (!value) return fail("Le titre est obligatoire");
  return value;
}

/** Sans le préfixe « undefined » : un champ absent n'apparaît pas dans le résultat. */
function compact<T extends object>(values: T): T {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined)) as T;
}

// ─── Actualités ─────────────────────────────────────────────────

export type ActuValues = {
  title?: string;
  category?: string | null;
  source?: string | null;
  subtitle?: string | null;
  excerpt?: string | null;
  eventDate?: Date | null;
  eventEndDate?: Date | null;
  timeLabel?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  imageUrl?: string | null;
  published?: boolean;
  isArchived?: boolean;
};

export function parseActuInput(body: unknown, mode: Mode): { values: ActuValues } | { error: string } {
  try {
    const input = asObject(body);
    const linkUrl = optText(input, "linkUrl", "Le lien", 500);
    if (linkUrl && !isPublicHref(linkUrl)) {
      return fail("Le lien doit commencer par http://, https://, mailto: ou / (page du site).");
    }
    const imageUrl = optText(input, "imageUrl", "L'image", 500);
    if (imageUrl && !isHttpUrl(imageUrl)) return fail("L'adresse de l'image doit commencer par http:// ou https://.");
    const eventDate = optDate(input, "eventDate", "La date");
    const eventEndDate = optDate(input, "eventEndDate", "La date de fin");
    if (eventDate && eventEndDate && eventEndDate < eventDate) return fail("La date de fin précède la date de début.");
    if (eventEndDate && eventDate === null) return fail("Une date de fin sans date de début.");
    const values: ActuValues = compact({
      title: title(input, mode),
      category: optText(input, "category", "L'étiquette", 100),
      source: optText(input, "source", "La source", 255),
      subtitle: optText(input, "subtitle", "Le sous-titre", 255),
      excerpt: optText(input, "excerpt", "Le texte", 10_000),
      eventDate,
      eventEndDate,
      timeLabel: optText(input, "timeLabel", "L'horaire", 100),
      linkUrl,
      linkLabel: optText(input, "linkLabel", "Le libellé du lien", 100),
      imageUrl,
      published: optBool(input, "published", "Publié"),
      isArchived: optBool(input, "isArchived", "Archivée"),
    });
    if (mode === "patch" && Object.keys(values).length === 0) return fail("Aucun champ à modifier");
    return { values };
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}

// ─── Médias ─────────────────────────────────────────────────────

export type MediaValues = {
  title?: string;
  type?: MediaType;
  mediaType?: string | null;
  videoUrl?: string | null;
  externalUrl?: string | null;
  pdfUrl?: string | null;
  date?: Date | null;
  source?: string | null;
  sortOrder?: number;
  published?: boolean;
};

/** Adresse http(s) optionnelle. */
function optHttpUrl(input: Record<string, unknown>, key: string, label: string): string | null | undefined {
  const value = optText(input, key, label, 500);
  if (value && !isHttpUrl(value)) return fail(`${label} doit commencer par http:// ou https://.`);
  return value;
}

/** Champ d'adresse dont dépend chaque type de média. */
const URL_FIELD: Record<MediaType, "videoUrl" | "externalUrl" | "pdfUrl"> = {
  video: "videoUrl",
  interview: "videoUrl",
  article: "externalUrl",
  archive: "externalUrl",
  presse: "pdfUrl",
};

const URL_LABEL = {
  videoUrl: "L'adresse de la vidéo",
  externalUrl: "L'adresse de l'article",
  pdfUrl: "L'adresse du PDF",
} as const;

export function parseMediaInput(body: unknown, mode: Mode): { values: MediaValues } | { error: string } {
  try {
    const input = asObject(body);
    const rawType = input.type;
    let type: MediaType | undefined;
    if (rawType !== undefined || mode === "create") {
      if (!isMediaType(rawType)) return fail("Type de média inconnu");
      type = rawType;
    }
    const videoUrl = optHttpUrl(input, "videoUrl", URL_LABEL.videoUrl);
    const video = videoUrl ? parseVideoUrl(videoUrl) : null;
    if (videoUrl && !video) {
      return fail("L'adresse de la vidéo doit être un lien Vimeo (vimeo.com/…) ou YouTube (youtube.com/watch?v=…, youtu.be/…).");
    }
    const externalUrl = optHttpUrl(input, "externalUrl", URL_LABEL.externalUrl);
    const pdfUrl = optHttpUrl(input, "pdfUrl", URL_LABEL.pdfUrl);
    const urls = { videoUrl, externalUrl, pdfUrl };
    // L'adresse dont dépend le type est obligatoire : à la création, et en
    // modification dès que le type ou cette adresse est envoyé (le formulaire
    // envoie toujours les deux).
    if (type) {
      const field = URL_FIELD[type];
      if ((mode === "create" || urls[field] !== undefined) && !urls[field]) {
        return fail(`${URL_LABEL[field]} est obligatoire pour ce type de média.`);
      }
    }
    let sortOrder: number | undefined;
    if (input.sortOrder !== undefined) {
      const n = typeof input.sortOrder === "string" ? Number(input.sortOrder) : input.sortOrder;
      if (typeof n !== "number" || !Number.isInteger(n) || Math.abs(n) > 1_000_000) return fail("L'ordre doit être un entier");
      sortOrder = n;
    }
    const values: MediaValues = compact({
      title: title(input, mode),
      type,
      // Plateforme déduite de l'adresse ; vidée avec elle.
      mediaType: videoUrl === undefined ? undefined : (video?.platform ?? null),
      ...urls,
      date: optDate(input, "date", "La date"),
      source: optText(input, "source", "Le sous-titre", 255),
      sortOrder,
      published: optBool(input, "published", "Publié"),
    });
    if (mode === "patch" && Object.keys(values).length === 0) return fail("Aucun champ à modifier");
    return { values };
  } catch (e) {
    if (e instanceof InputError) return { error: e.message };
    throw e;
  }
}
