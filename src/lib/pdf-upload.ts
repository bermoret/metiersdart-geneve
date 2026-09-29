// Envoi de PDF depuis l'admin (revue de presse JEMA, articles archivés) :
// règles partagées entre le formulaire (navigateur) et la route qui délivre le
// jeton Blob (src/app/api/admin/upload/pdf/route.ts). Fonctions pures, testées.

/** 50 Mo : la revue de presse JEMA 2025 en fait 36. */
export const PDF_MAX_BYTES = 50 * 1024 * 1024;

const PDF_MAGIC = "%PDF-";

/** Les premiers octets d'un fichier sont-ils ceux d'un PDF (« %PDF-") ? */
export function hasPdfMagic(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_MAGIC.length) return false;
  return [...PDF_MAGIC].every((c, i) => bytes[i] === c.charCodeAt(0));
}

/** Chemin Blob d'un PDF : presse/<nom nettoyé>.pdf (Blob ajoute un suffixe aléatoire). */
export function pdfPathname(fileName: string): string {
  const stem = fileName
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 80);
  return `presse/${stem || "document"}.pdf`;
}

/** Chemin accepté par la route du jeton : presse/<nom simple>.pdf (un seul segment, sans « / »). */
export function isPdfPathname(value: unknown): value is string {
  return typeof value === "string" && /^presse\/[a-z0-9][a-z0-9._-]{0,79}\.pdf$/.test(value);
}
