// Photo d'une annonce (LOT C), côté serveur : contrôle du fichier reçu en
// multipart (octets magiques, taille) puis dépôt dans Vercel Blob en accès
// public avec suffixe aléatoire (URL non devinable, affichée aux membres).
// Importé par les routes seulement.

import { del, put } from "@vercel/blob";
import { ANNONCE_PHOTO_MAX_BYTES, ANNONCE_PHOTO_TYPES, annoncePhotoPathname, detectImageType } from "./annonces";

export type CheckedPhoto = { bytes: Uint8Array; type: keyof typeof ANNONCE_PHOTO_TYPES };

/** Contrôle du fichier (taille, octets magiques), sans rien déposer. */
export async function checkAnnoncePhoto(file: File): Promise<CheckedPhoto | { error: string }> {
  if (file.size > ANNONCE_PHOTO_MAX_BYTES) return { error: "Photo trop volumineuse (4 Mo maximum)" };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return { error: "Photo : formats admis JPEG, PNG ou WebP" };
  return { bytes, type };
}

/** Dépôt d'une photo contrôlée dans Blob (public, suffixe aléatoire). */
export async function putAnnoncePhoto(photo: CheckedPhoto): Promise<string> {
  const blob = await put(annoncePhotoPathname(photo.type), Buffer.from(photo.bytes), {
    access: "public",
    addRandomSuffix: true,
    contentType: photo.type,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return blob.url;
}

export type StoredPhoto = { url: string } | { error: string };

/** Contrôle puis dépôt (admin : pas de quota entre les deux). */
export async function storeAnnoncePhoto(file: File): Promise<StoredPhoto> {
  const checked = await checkAnnoncePhoto(file);
  if ("error" in checked) return checked;
  return { url: await putAnnoncePhoto(checked) };
}

/** Suppression silencieuse d'une photo (nettoyage après erreur ou retrait). */
export async function discardAnnoncePhoto(url: string | null | undefined): Promise<void> {
  if (!url) return;
  await del(url).catch((e) => console.error("[annonces] suppression de la photo impossible :", e));
}
