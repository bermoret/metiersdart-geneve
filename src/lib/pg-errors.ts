/** Erreur Postgres (pg) portant ce code SQLSTATE (23505 unique, 23503 clé étrangère…). */
export function isPgError(e: unknown, code: string): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: unknown }).code === code;
}
