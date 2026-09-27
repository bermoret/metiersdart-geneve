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
