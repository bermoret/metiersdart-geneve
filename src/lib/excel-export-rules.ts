// Export Excel « Stat_GLOBALES » (LOT A2) : règles pures de mise en forme des
// valeurs écrites dans le gabarit (src/data/stat-globales-template.xlsx),
// testées dans excel-export-rules.test.ts. L'écriture elle-même est dans
// src/lib/excel-export.ts (serveur).

import { normalizeName } from "./mag-excel";

/** Libellés de domaine tels que MAG les écrit dans son classeur (≠ noms du site). */
const EXCEL_DOMAINE_LABELS: Record<string, string> = {
  "art de l horlogerie et de la bijouterie": "Art de l'horlogerie / bijouterie",
  "art de la conservation et de la restauration": "Art de la conservation et restauration",
};

/** Nom de catégorie du site → libellé du classeur (identique par défaut). */
export function excelDomaineLabel(categoryName: string | null | undefined): string | null {
  if (!categoryName) return null;
  return EXCEL_DOMAINE_LABELS[normalizeName(categoryName)] ?? categoryName;
}

/** En-tête de colonne des cartographies : domaine en capitales sans accent. */
export function cartographyHeader(categoryName: string): string {
  return categoryName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

/** Colonne NOM : en capitales, comme dans le classeur. */
export function excelSurname(lastName: string | null | undefined): string | null {
  const t = lastName?.trim();
  return t ? t.toUpperCase() : null;
}

/** Colonne A de GLOBAL : « NOM Prénom », sinon la raison sociale, sinon le nom de la fiche. */
export function globalName(d: { lastName?: string | null; firstName?: string | null; workshopName?: string | null }, ficheName: string | null): string | null {
  const nom = excelSurname(d.lastName);
  const prenom = d.firstName?.trim();
  if (nom && prenom) return `${nom} ${prenom}`;
  if (nom) return nom;
  return d.workshopName?.trim() || ficheName || null;
}

/** « 10.10.26 » pour les cellules « Dernière MàJ : … ». */
export function shortDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(`${iso.slice(0, 10)}T00:00:00Z`) : iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${String(d.getUTCFullYear()).slice(2)}`;
}

export function lastUpdateLabel(day: string | Date): string {
  return `Dernière MàJ : ${shortDate(day)}`;
}

/** « YYYY-MM-DD » → Date UTC minuit (cellule date Excel). */
export function excelDate(iso: string | null | undefined): Date | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

/** Adresse sur plusieurs lignes : rue, puis « NPA Ville » (forme du classeur). */
export function addressLines(d: { street?: string | null; postalCode?: string | null; city?: string | null }): string | null {
  const locality = [d.postalCode?.trim(), d.city?.trim()].filter(Boolean).join(" ");
  const lines = [d.street?.trim(), locality].filter(Boolean);
  return lines.length ? lines.join("\n") : null;
}

/** Entrées de journal → colonne COMMENTAIRES : « 07.02.24 : texte », une par ligne, récente en tête. */
export function commentsCell(entries: readonly { occurredAt: string; text: string | null; type: string }[]): string | null {
  const lines = entries
    .filter((e) => e.text && e.type === "remarque")
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0))
    .map((e) => `${shortDate(e.occurredAt)} : ${e.text!.replace(/\s+/g, " ").trim()}`);
  return lines.length ? lines.join("\n") : null;
}

/** Colonne ENTREPRISE FORMATRICE : « OUI », « OUI. note », « NON », vide. */
export function trainerCell(trainerCompany: boolean | null | undefined, note: string | null | undefined): string | null {
  if (trainerCompany === null || trainerCompany === undefined) return null;
  const base = trainerCompany ? "OUI" : "NON";
  const n = note?.replace(/\s+/g, " ").trim();
  return n ? `${base}. ${n}` : base;
}

/** Formule COUNTA sur une colonne entre deux lignes (ranges du classeur réécrits). */
export function countaFormula(col: string, from: number, to: number): string {
  return `COUNTA(${col}${from}:${col}${Math.max(from, to)})`;
}

/** Numéro de colonne (1 = A) → lettres. */
export function colLetter(n: number): string {
  let s = "";
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
}

/** Tri français insensible à la casse et aux accents. */
export function sortFr(values: readonly string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

/**
 * Métiers distincts à partir du champ « métier » des fiches : les fiches en
 * citent parfois plusieurs (« Bijoutier · Joaillier », « Bottière • Cordonnière »,
 * « Tailleur / Couturier »). Séparateurs : « · », « • », « / », « , », « ; ».
 */
export function splitCrafts(craft: string | null | undefined): string[] {
  return (craft ?? "")
    .split(/\s*[·•/,;]\s*/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Nombre de métiers distincts (insensible à la casse et aux accents). */
export function distinctCrafts(crafts: readonly (string | null | undefined)[]): string[] {
  const seen = new Map<string, string>();
  for (const c of crafts) for (const part of splitCrafts(c)) {
    const key = normalizeName(part);
    if (key && !seen.has(key)) seen.set(key, part);
  }
  return sortFr([...seen.values()]);
}
