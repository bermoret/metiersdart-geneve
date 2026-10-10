// Petites annonces de l'Espace Communauté (LOT C) : règles partagées entre la
// page membres (navigateur), la modération admin et les routes API. Fichier
// pur, testé dans annonces.test.ts.

export const ANNONCE_CATEGORIES = [
  "Vente de matériel",
  "Recherche d'artisan",
  "Opportunités professionnelles",
  "Collaborations",
  "Événements",
  "Expositions",
  "Conseils et ressources",
  "Retours d'expérience",
  "Entraide",
] as const;

export type AnnonceCategory = (typeof ANNONCE_CATEGORIES)[number];

export function isAnnonceCategory(v: unknown): v is AnnonceCategory {
  return typeof v === "string" && (ANNONCE_CATEGORIES as readonly string[]).includes(v);
}

export const ANNONCE_TITLE_MAX = 500;
export const ANNONCE_AUTHOR_MAX = 255;
export const ANNONCE_CONTENT_MAX = 10_000;

/** 4 Mo : une fonction Vercel refuse les corps de plus de 4,5 Mo ; le navigateur réduit l'image avant l'envoi. */
export const ANNONCE_PHOTO_MAX_BYTES = 4 * 1024 * 1024;

export const ANNONCE_PHOTO_TYPES: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : "");

// Adresse plausible : quelque chose @ quelque chose . quelque chose, sans espace.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AnnonceInput = {
  title: string;
  category: AnnonceCategory;
  authorName: string;
  authorEmail: string | null;
  content: string;
};

/** Soumission d'une annonce (membres) : champs requis, bornés, catégorie de la liste. */
export function parseAnnonceInput(body: unknown): { ok: true; value: AnnonceInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const title = str(b.title);
  const category = str(b.category);
  const authorName = str(b.authorName);
  const authorEmail = str(b.authorEmail) || null;
  const content = str(b.content);
  if (!title || !content || !category || !authorName) {
    return { ok: false, error: "Titre, catégorie, auteur et contenu sont requis" };
  }
  if (!isAnnonceCategory(category)) return { ok: false, error: "Catégorie inconnue" };
  if (title.length > ANNONCE_TITLE_MAX) return { ok: false, error: `Titre trop long (${ANNONCE_TITLE_MAX} caractères maximum)` };
  if (authorName.length > ANNONCE_AUTHOR_MAX) return { ok: false, error: `Nom trop long (${ANNONCE_AUTHOR_MAX} caractères maximum)` };
  if (authorEmail && (authorEmail.length > ANNONCE_AUTHOR_MAX || !EMAIL_RE.test(authorEmail))) {
    return { ok: false, error: "Adresse e-mail invalide" };
  }
  if (content.length > ANNONCE_CONTENT_MAX) return { ok: false, error: `Contenu trop long (${ANNONCE_CONTENT_MAX} caractères maximum)` };
  return { ok: true, value: { title, category, authorName, authorEmail, content } };
}

export type AnnonceEdit = Partial<Pick<AnnonceInput, "title" | "category" | "authorName" | "content">> & { authorEmail?: string | null };

/**
 * Modification par MAG (admin) : seuls les champs présents changent, mêmes
 * bornes qu'à la soumission ; un champ requis vidé est refusé.
 */
export function parseAnnonceEdit(body: unknown): { ok: true; patch: AnnonceEdit } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const patch: AnnonceEdit = {};
  if (b.title !== undefined) {
    const t = str(b.title);
    if (!t) return { ok: false, error: "Le titre est requis" };
    if (t.length > ANNONCE_TITLE_MAX) return { ok: false, error: `Titre trop long (${ANNONCE_TITLE_MAX} caractères maximum)` };
    patch.title = t;
  }
  if (b.category !== undefined) {
    const c = str(b.category);
    if (!isAnnonceCategory(c)) return { ok: false, error: "Catégorie inconnue" };
    patch.category = c;
  }
  if (b.authorName !== undefined) {
    const a = str(b.authorName);
    if (!a) return { ok: false, error: "L'auteur est requis" };
    if (a.length > ANNONCE_AUTHOR_MAX) return { ok: false, error: `Nom trop long (${ANNONCE_AUTHOR_MAX} caractères maximum)` };
    patch.authorName = a;
  }
  if (b.authorEmail !== undefined) {
    const e = str(b.authorEmail);
    if (e && (e.length > ANNONCE_AUTHOR_MAX || !EMAIL_RE.test(e))) return { ok: false, error: "Adresse e-mail invalide" };
    patch.authorEmail = e || null;
  }
  if (b.content !== undefined) {
    const c = str(b.content);
    if (!c) return { ok: false, error: "Le contenu est requis" };
    if (c.length > ANNONCE_CONTENT_MAX) return { ok: false, error: `Contenu trop long (${ANNONCE_CONTENT_MAX} caractères maximum)` };
    patch.content = c;
  }
  return { ok: true, patch };
}

/**
 * Type d'image d'après les premiers octets (le type annoncé par le navigateur
 * n'est pas une preuve) : JPEG, PNG ou WebP, sinon null.
 */
export function detectImageType(bytes: Uint8Array): keyof typeof ANNONCE_PHOTO_TYPES | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP") {
    return "image/webp";
  }
  return null;
}

/** Chemin Blob d'une photo d'annonce ; Blob ajoute un suffixe aléatoire (URL non devinable). */
export function annoncePhotoPathname(contentType: keyof typeof ANNONCE_PHOTO_TYPES, now: Date = new Date()): string {
  return `annonces/${now.toISOString().slice(0, 10)}-photo.${ANNONCE_PHOTO_TYPES[contentType]}`;
}
