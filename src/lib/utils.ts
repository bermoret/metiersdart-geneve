// Slugify helper
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// Helper: latitude/longitude stockées en microdegrés (int) -> degres decimaux
export function latFromDB(microdeg: number | null): number | null {
  if (microdeg === null) return null;
  return microdeg / 1e6;
}
export function latToDB(deg: number): number {
  return Math.round(deg * 1e6);
}
