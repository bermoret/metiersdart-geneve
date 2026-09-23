// Miniatures des vidéos (capsules Vimeo, interviews YouTube), résolues côté
// serveur (composants serveur) pour servir d'affiche avant la lecture.

/**
 * URL de la miniature d'une vidéo, ou null si elle est introuvable.
 * - YouTube : URL déterministe, sans appel réseau.
 * - Vimeo : API oEmbed publique (la miniature n'est pas dérivable de l'id),
 *   mise en cache 24 h par Next.
 * Ne lève jamais : une miniature manquante retombe sur l'affiche par défaut.
 * Délai de 3 s : un Vimeo lent ne doit ni bloquer le build (38 appels sur
 * /medias) ni le premier rendu d'une page ISR.
 */
export async function videoThumbnail(
  platform: "vimeo" | "youtube",
  videoId: string,
): Promise<string | null> {
  if (platform === "youtube") {
    if (!/^[\w-]{11}$/.test(videoId)) return null;
    return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  }
  if (!/^\d+$/.test(videoId)) return null;
  try {
    const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
      `https://vimeo.com/${videoId}`,
    )}&width=640`;
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const thumb =
      data && typeof data === "object" && "thumbnail_url" in data
        ? data.thumbnail_url
        : null;
    return typeof thumb === "string" && /^https:\/\/i\.vimeocdn\.com\//.test(thumb) ? thumb : null;
  } catch {
    return null;
  }
}
