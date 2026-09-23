// Formatage des dates d'éditions (JEMA) en français.

/**
 * Plage courte pour les cartes : « 27-29 mars 2026 »,
 * « 30 mars - 1 avril 2029 », « 30 décembre 2029 - 2 janvier 2030 ».
 */
export function formatShortRange(start: Date | null, end: Date | null): string {
  if (!start) return "";
  const month = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long" });
  const full = (d: Date) => `${d.getDate()} ${month(d)} ${d.getFullYear()}`;
  if (!end || start.toDateString() === end.toDateString()) return full(start);
  if (start.getFullYear() !== end.getFullYear()) {
    return `${full(start)} - ${full(end)}`;
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${start.getDate()} ${month(start)} - ${end.getDate()} ${month(end)} ${end.getFullYear()}`;
  }
  return `${start.getDate()}-${end.getDate()} ${month(start)} ${end.getFullYear()}`;
}
