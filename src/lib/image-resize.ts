// Réduction d'une photo dans le navigateur avant envoi (LOT C) : côté long
// ramené à 1600 px, JPEG à 85 %. Une photo de téléphone (3-6 Mo) tient alors
// en quelques centaines de Ko, sous la limite des fonctions Vercel (4,5 Mo).
// En cas d'échec (format non décodable par le navigateur), le fichier
// d'origine est renvoyé tel quel et le serveur tranche.

export const RESIZE_MAX_SIDE = 1600;

export async function downscaleImage(file: File, maxSide = RESIZE_MAX_SIDE, quality = 0.85): Promise<{ blob: Blob; type: string; name: string }> {
  const fallback = { blob: file, type: file.type, name: file.name };
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return fallback;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return fallback;
  }
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    // Déjà petite et légère : on garde l'original (PNG avec transparence compris).
    if (scale === 1 && file.size <= 1024 * 1024) return fallback;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback;
    // JPEG n'a pas de transparence : fond blanc plutôt que noir pour les PNG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return fallback;
    return { blob, type: "image/jpeg", name: file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg" };
  } finally {
    bitmap.close();
  }
}
