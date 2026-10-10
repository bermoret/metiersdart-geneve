// Reprise de l'historique depuis le fichier Excel de MAG (Stat_GLOBALES.xlsx,
// onglets « Artisan·e·s » et « GLOBAL ») : règles pures de lecture des
// cellules, de rapprochement avec les fiches du site et de détection des
// sorties. Utilisées par scripts/import-excel-mag.ts, testées dans
// mag-excel.test.ts. Mapping : docs/plateforme-gestion.md § 5.

/** Minuscules, sans accent ni ponctuation, espaces simples. */
export function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** « LUGRIN » → « Lugrin », « LO BUE » → « Lo Bue » ; une casse mixte est gardée. */
export function surnameCase(s: string | null | undefined): string | null {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (t !== t.toUpperCase()) return t;
  return t
    .toLowerCase()
    .replace(/(^|[\s'’-])(\p{L})/gu, (_m, sep: string, c: string) => sep + c.toUpperCase());
}

/** Numéro de série Excel (jours depuis le 30.12.1899) → « YYYY-MM-DD ». */
export function excelSerialToIso(n: number | null | undefined): string | null {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 1) return null;
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Cellule date lue par exceljs (Date) ou nombre de série → « YYYY-MM-DD ». */
export function cellToIsoDate(v: unknown): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  if (typeof v === "number") return excelSerialToIso(v);
  if (typeof v === "string") {
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v.trim());
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return v.trim();
  }
  return null;
}

/**
 * Adresse multi-lignes de l'Excel → rue / NPA / ville. La dernière ligne
 * « 1242 Satigny » donne NPA et ville ; le reste devient la rue (lignes
 * jointes par une virgule). Sans ligne NPA, tout va dans la rue.
 */
export function splitAddress(raw: string | null | undefined): { street: string | null; postalCode: string | null; city: string | null } {
  const lines = (raw ?? "").split(/\r?\n|\s*\/\s*/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { street: null, postalCode: null, city: null };
  const last = lines[lines.length - 1];
  const m = /^(\d{4})\s+(.+)$/.exec(last);
  if (m) {
    const street = lines.slice(0, -1).join(", ");
    return { street: street || null, postalCode: m[1], city: m[2].trim() };
  }
  return { street: lines.join(", "), postalCode: null, city: null };
}

/** Cellule à plusieurs valeurs (téléphones, mails) : première + les autres. */
export function splitMulti(raw: string | null | undefined): { first: string | null; others: string[] } {
  const parts = (raw ?? "").split(/\r?\n|\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
  return { first: parts[0] ?? null, others: parts.slice(1) };
}

const MONTHS_FR: Record<string, number> = {
  jan: 1, janv: 1, janvier: 1, fev: 2, fév: 2, fevr: 2, févr: 2, fevrier: 2, février: 2, mar: 3, mars: 3, avr: 4, avril: 4,
  mai: 5, juin: 6, juil: 7, juillet: 7, aou: 8, aoû: 8, aout: 8, août: 8, sep: 9, sept: 9, septembre: 9,
  oct: 10, octobre: 10, nov: 11, novembre: 11, dec: 12, déc: 12, decembre: 12, décembre: 12,
};

function year4(y: string): number {
  return y.length === 2 ? 2000 + Number(y) : Number(y);
}

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return dt.toISOString().slice(0, 10);
}

/**
 * Commentaire de l'Excel → date de l'événement + texte. Formes reconnues en
 * tête : « 07.02.24 : », « 19.09.2023 : », « 11.25 : » (1er du mois),
 * « 16.07.25: », « Oct 25 : ». Sans date reconnue, le texte est gardé intact
 * et occurredAt vaut null (le script prend alors la date d'import).
 */
export function parseComment(raw: string | null | undefined): { occurredAt: string | null; text: string } {
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!text) return { occurredAt: null, text: "" };
  let m = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\s*:\s*(.*)$/.exec(text);
  if (m) return { occurredAt: iso(year4(m[3]), Number(m[2]), Number(m[1])), text: m[4].trim() || text };
  m = /^(\d{1,2})\.(\d{2})\s*:\s*(.*)$/.exec(text);
  if (m) return { occurredAt: iso(year4(m[2]), Number(m[1]), 1), text: m[3].trim() || text };
  m = /^([A-Za-zéûÉÛ]{3,9})\.?\s+(\d{2}|\d{4})\s*:\s*(.*)$/.exec(text);
  if (m) {
    const month = MONTHS_FR[m[1].toLowerCase()];
    if (month) return { occurredAt: iso(year4(m[2]), month, 1), text: m[3].trim() || text };
  }
  return { occurredAt: null, text };
}

export type ExitReason = "faillite" | "fermeture_atelier" | "retraite" | "depart" | "retrait_catalogue";

/** Motif de sortie déduit d'un commentaire, ou null (ex. « activité en suspens »). */
export function detectExit(text: string | null | undefined): ExitReason | null {
  const t = normalizeName(text);
  if (!t) return null;
  if (/\bfaillite\b/.test(t)) return "faillite";
  if (/\bliquidation\b/.test(t)) return "fermeture_atelier";
  if (/\bretraite\b/.test(t)) return "retraite";
  if (/\bfin d activite\b/.test(t) || /\bcessation\b/.test(t) || /\bferme(e|ture)?\b/.test(t)) return "fermeture_atelier";
  if (/\bretirer\b|\bretire\b|\bretrait\b/.test(t)) return "retrait_catalogue";
  if (/\bpart a l etranger\b|\bdepart\b|\bparti\b/.test(t)) return "depart";
  return null;
}

/** Libellé de domaine de l'Excel → nom de catégorie du site (identique sinon). */
export function mapDomaine(label: string | null | undefined, siteCategories: readonly string[]): string | null {
  const key = normalizeName(label);
  if (!key) return null;
  const aliases: Record<string, string> = {
    "art de l horlogerie bijouterie": "art de l horlogerie et de la bijouterie",
    "art de la conservation et restauration": "art de la conservation et de la restauration",
    "arts appliques": "arts appliques",
  };
  const wanted = aliases[key] ?? key;
  return siteCategories.find((c) => normalizeName(c) === wanted) ?? null;
}

/** Colonne « ENTREPRISE FORMATRICE » : « OUI », « OUI. … OFPC », vide. */
export function parseTrainerCompany(raw: string | null | undefined): { trainerCompany: boolean | null; note: string | null } {
  const t = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!t) return { trainerCompany: null, note: null };
  const m = /^(oui|non)\b\.?\s*(.*)$/i.exec(t);
  if (!m) return { trainerCompany: null, note: t };
  return { trainerCompany: m[1].toLowerCase() === "oui", note: m[2].trim() || null };
}

/** Onglet GLOBAL, colonnes B / C / D (« X ») → type de poinçon. */
export function poinconFromGlobal(b: unknown, c: unknown, d: unknown): "ATELIER" | "BOUTIQUE" | "ENTREPRISE" | null {
  const on = (v: unknown) => typeof v === "string" && v.trim().toUpperCase() === "X";
  if (on(b)) return "ATELIER";
  if (on(c)) return "BOUTIQUE";
  if (on(d)) return "ENTREPRISE";
  return null;
}

export type ExcelArtisanRow = {
  rowNumber: number;
  commune: string | null;
  integratedAt: string | null;
  domaine: string | null;
  craft: string | null;
  lastName: string | null;
  firstName: string | null;
  workshopName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  comment: string | null;
  trainerCompany: string | null;
  /** Ligne située après le séparateur « Retiré du répertoire » de l'onglet. */
  retired: boolean;
};

export type FicheCandidate = { id: string; name: string; slug: string };

export type MatchResult =
  | { kind: "nom_prenom" | "raison_sociale"; fiche: FicheCandidate }
  | { kind: "nom_seul"; fiche: FicheCandidate }
  | { kind: "ambigu"; candidates: FicheCandidate[] }
  | { kind: "aucun" };

/**
 * Rapprochement d'une ligne Excel avec les fiches du site (§ 5) :
 * 1. nom ET prénom dans le nom de la fiche ; 2. raison sociale (≥ 4 car.)
 * égale ou contenue ; 3. nom seul dans une unique fiche (à confirmer) ;
 * plusieurs candidates → ambigu ; sinon aucun.
 */
export function matchArtisan(row: Pick<ExcelArtisanRow, "lastName" | "firstName" | "workshopName">, fiches: readonly FicheCandidate[]): MatchResult {
  const nom = normalizeName(row.lastName);
  const prenom = normalizeName(row.firstName);
  const rs = normalizeName(row.workshopName);
  const has = (hay: string, needle: string) => !!needle && ` ${hay} `.includes(` ${needle} `);
  const byName = nom && prenom ? fiches.filter((f) => has(normalizeName(f.name), nom) && has(normalizeName(f.name), prenom)) : [];
  if (byName.length === 1) return { kind: "nom_prenom", fiche: byName[0] };
  if (byName.length > 1) return { kind: "ambigu", candidates: byName };
  const byShop = rs.length >= 4 ? fiches.filter((f) => normalizeName(f.name) === rs || has(normalizeName(f.name), rs)) : [];
  if (byShop.length === 1) return { kind: "raison_sociale", fiche: byShop[0] };
  if (byShop.length > 1) return { kind: "ambigu", candidates: byShop };
  const bySurname = nom.length >= 3 ? fiches.filter((f) => has(normalizeName(f.name), nom)) : [];
  if (bySurname.length === 1) return { kind: "nom_seul", fiche: bySurname[0] };
  if (bySurname.length > 1) return { kind: "ambigu", candidates: bySurname };
  return { kind: "aucun" };
}
