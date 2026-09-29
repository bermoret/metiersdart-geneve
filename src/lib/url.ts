// Liens saisis dans l'admin (programme JEMA…) : seuls http(s) sont acceptés —
// un « javascript: » ou un chemin relatif finirait tel quel dans un href public.

/** Adresse absolue en http:// ou https://, analysable par URL. */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lien d'une carte d'actualité, tel qu'il finira dans un href public : http(s)
 * (`isHttpUrl`), « mailto:adresse » (Conseil des artisans → contact@…) ou un
 * chemin du site commençant par un seul « / » (« /jema »). Tout autre schéma
 * (javascript:, data:, //hôte…) est refusé.
 */
export function isPublicHref(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (isHttpUrl(value)) return true;
  if (/^mailto:[^\s@/?#]+@[^\s@/?#]+\.[^\s@/?#]+$/i.test(value)) return true;
  return /^\/(?![/\\])[^\s]*$/.test(value);
}

/** Lien externe au site (http(s)) : ouvert dans un nouvel onglet. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
