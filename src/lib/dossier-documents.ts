// Pièces justificatives des dossiers artisans (LOT A1) : règles partagées
// entre l'écran (navigateur), la route du jeton d'envoi direct vers Vercel
// Blob et la route d'enregistrement / téléchargement. Fichier pur, testé.
//
// Les pièces sont des blobs PRIVÉS : la base ne garde que le chemin, jamais
// une URL, et seule la route admin de téléchargement les sert.

import { UUID_RE } from "./dossier-fields";

/** 10 Mo : attestations, extraits et CV scannés. */
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_CONTENT_TYPES: Readonly<Record<string, string>> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const DOCUMENT_KINDS = [
  { value: "attestation_avs", label: "Attestation caisse AVS" },
  { value: "extrait_rc", label: "Extrait du registre du commerce" },
  { value: "cv", label: "CV ou références" },
  { value: "diplome", label: "Diplôme ou certificat" },
  { value: "autre", label: "Autre pièce" },
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number]["value"];

export function isDocumentKind(v: unknown): v is DocumentKind {
  return DOCUMENT_KINDS.some((k) => k.value === v);
}

export function isAllowedContentType(v: unknown): v is keyof typeof DOCUMENT_CONTENT_TYPES {
  return typeof v === "string" && Object.hasOwn(DOCUMENT_CONTENT_TYPES, v);
}

function cleanStem(fileName: string): string {
  return fileName
    .replace(/\.[a-z0-9]+$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 80);
}

/**
 * Chemin Blob demandé pour une pièce : dossiers/<id du dossier>/<nom>.<ext>.
 * L'extension vient du type MIME (pas du nom de fichier) ; null si le type
 * n'est pas admis. Blob ajoute ensuite un suffixe aléatoire au nom.
 */
export function documentPathname(dossierId: string, fileName: string, contentType: string): string | null {
  if (!UUID_RE.test(dossierId) || !isAllowedContentType(contentType)) return null;
  const stem = cleanStem(fileName) || "piece";
  return `dossiers/${dossierId.toLowerCase()}/${stem}.${DOCUMENT_CONTENT_TYPES[contentType]}`;
}

const PATHNAME_RE = /^dossiers\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([a-z0-9][A-Za-z0-9._-]{0,139}\.(pdf|jpg|png|webp))$/;

/**
 * Chemin accepté (demandé au jeton, ou renvoyé par Blob avec son suffixe) :
 * un seul segment sous dossiers/<uuid>/, extension admise. Renvoie l'uuid du
 * dossier auquel il appartient, pour le comparer à celui de la route.
 */
export function parseDocumentPathname(value: unknown): { dossierId: string; ext: string } | null {
  if (typeof value !== "string") return null;
  const m = PATHNAME_RE.exec(value);
  if (!m || value.includes("..")) return null;
  return { dossierId: m[1], ext: m[3] };
}

/** Nom de fichier proposé au téléchargement, ASCII sûr + variante UTF-8 (RFC 5987). */
export function contentDisposition(label: string, ext: string, inline: boolean): string {
  const base = label.replace(/\.[a-z0-9]+$/i, "").trim().slice(0, 100) || "piece";
  const ascii = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/["\;]/g, "")
    .trim() || "piece";
  const utf8 = encodeURIComponent(`${base}.${ext}`).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `${inline ? "inline" : "attachment"}; filename="${ascii}.${ext}"; filename*=UTF-8''${utf8}`;
}
