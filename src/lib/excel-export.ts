// Export « Stat_GLOBALES.xlsx » (LOT A2) : remplit le gabarit
// src/data/stat-globales-template.xlsx (classeur de MAG vidé des données
// personnelles, voir scripts/build-excel-template.ts) avec les données de la
// base. Onglets régénérés : « Artisan·e·s », « GLOBAL » (colonnes A-E et
// listes G, K, M, O, U), « Cartographie artisans », « Cartographie métiers »,
// « Entreprises formatrices », « Métiers », « Communes ». Les autres onglets
// restent ceux du classeur de référence (listes historiques, INMA, ASMA…).
//
// Ce module ne lit pas la base : il reçoit `ExportData` (src/lib/stats-db.ts
// côté serveur, données statiques en mode hors ligne du script) et peut donc
// tourner sans DATABASE_URL.

import ExcelJS from "exceljs";
import path from "node:path";
import { normalizeName } from "./mag-excel";
import {
  addressLines,
  cartographyHeader,
  colLetter,
  commentsCell,
  countaFormula,
  distinctCrafts,
  excelDate,
  excelDomaineLabel,
  excelSurname,
  globalName,
  lastUpdateLabel,
  sortFr,
  trainerCell,
} from "./excel-export-rules";

export const TEMPLATE_PATH = path.join(process.cwd(), "src", "data", "stat-globales-template.xlsx");

export type ExportArtisanRow = {
  status: "actif" | "desactive";
  integratedAt: string | null;
  deactivatedAt: string | null;
  deactivationReason: string | null;
  lastName: string | null;
  firstName: string | null;
  workshopName: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  commune: string | null;
  trainerCompany: boolean | null;
  trainerCompanyNote: string | null;
  avsFund: string | null;
  poinconType: string | null;
  /** Fiche publique liée (null pour une sortie sans fiche). */
  ficheName: string | null;
  craft: string | null;
  categoryName: string | null;
  comments: { occurredAt: string; text: string | null; type: string }[];
};

export type ExportEntity = {
  name: string;
  type: string;
  commune: string | null;
};

export type ExportData = {
  /** Jour de génération, « YYYY-MM-DD ». */
  generatedAt: string;
  /** Dossiers actifs et désactivés (une ligne par artisan·e). */
  artisans: ExportArtisanRow[];
  /** Domaines d'art du site, dans l'ordre d'affichage. */
  categories: string[];
  /** Les 45 communes, avec le statut partenaire géré dans l'admin. */
  communes: { name: string; soutientMag: boolean }[];
  /** Fiches publiées de tous types (artisans, écoles, institutions, associations, partenaires). */
  entities: ExportEntity[];
};

const ARTISAN_TYPES = new Set(["artisan", "atelier", "entreprise"]);
const ENTITY_TYPES = {
  institution: "institution_culturelle",
  ecole: "ecole_formatrice",
  association: "association_professionnelle",
  partenaire: "partenaire",
} as const;

function byDateDesc(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? 1 : -1;
}

/** Vide une plage (valeurs seulement). */
function clear(ws: ExcelJS.Worksheet, fromRow: number, toRow: number, fromCol: number, toCol: number): void {
  for (let r = fromRow; r <= toRow; r++) for (let c = fromCol; c <= toCol; c++) ws.getCell(r, c).value = null;
}

const DATE_FMT = "mm-dd-yy";

function setDate(cell: ExcelJS.Cell, iso: string | null): void {
  const d = excelDate(iso);
  cell.value = d;
  if (d) cell.numFmt = DATE_FMT;
}

function setFormula(cell: ExcelJS.Cell, formula: string): void {
  cell.value = { formula, date1904: false } as ExcelJS.CellFormulaValue;
}

// ─── Onglets ────────────────────────────────────────────────────

function fillArtisans(ws: ExcelJS.Worksheet, data: ExportData): void {
  const actifs = data.artisans.filter((a) => a.status === "actif").sort((a, b) => byDateDesc(a.integratedAt, b.integratedAt) || (a.ficheName ?? "").localeCompare(b.ficheName ?? "", "fr"));
  const sortis = data.artisans.filter((a) => a.status === "desactive").sort((a, b) => byDateDesc(a.deactivatedAt, b.deactivatedAt));
  const header = ws.getRow(3);
  const write = (r: number, a: ExportArtisanRow) => {
    const row = ws.getRow(r);
    row.height = 47;
    row.getCell(1).value = a.commune ?? null;
    setDate(row.getCell(2), a.integratedAt);
    row.getCell(3).value = excelDomaineLabel(a.categoryName);
    row.getCell(4).value = a.craft ?? null;
    row.getCell(5).value = excelSurname(a.lastName);
    row.getCell(6).value = a.firstName ?? null;
    row.getCell(7).value = a.workshopName ?? a.ficheName ?? null;
    row.getCell(8).value = a.phone ?? null;
    row.getCell(9).value = a.email ?? null;
    row.getCell(10).value = addressLines(a);
    row.getCell(11).value = commentsCell(a.comments);
    row.getCell(12).value = trainerCell(a.trainerCompany, a.trainerCompanyNote);
    for (let c = 1; c <= 12; c++) row.getCell(c).alignment = { wrapText: true, vertical: "top" };
  };
  let r = 4;
  for (const a of actifs) write(r++, a);
  const lastActif = r - 1;
  if (sortis.length) {
    r++;
    const sep = ws.getRow(r);
    sep.height = 47;
    for (let c = 1; c <= 12; c++) {
      const cell = sep.getCell(c);
      cell.value = "Retiré du répertoire";
      cell.style = { ...header.getCell(c).style };
    }
    ws.mergeCells(r, 1, r, 12);
    r++;
    for (const a of sortis) write(r++, a);
  }
  // Compteurs de la ligne 2 : une formule par colonne, sur les actifs.
  for (let c = 1; c <= 12; c++) setFormula(ws.getCell(2, c), countaFormula(colLetter(c), 4, lastActif));
  ws.getCell("N2").value = lastUpdateLabel(data.generatedAt);
}

function fillGlobal(ws: ExcelJS.Worksheet, data: ExportData): void {
  const actifs = data.artisans.filter((a) => a.status === "actif").map((a) => ({ a, name: globalName(a, a.ficheName) ?? "" })).filter((x) => x.name);
  actifs.sort((x, y) => x.name.localeCompare(y.name, "fr", { sensitivity: "base" }));
  const first = 17;
  const end = Math.max(ws.rowCount, first + actifs.length);
  // Colonnes A-E (noms, poinçon, caisse AVS) et listes G, K, M, O, U régénérées.
  for (const col of [1, 2, 3, 4, 5, 7, 11, 13, 15, 21]) clear(ws, first, end, col, col);
  actifs.forEach(({ a, name }, i) => {
    const row = ws.getRow(first + i);
    row.getCell(1).value = name;
    const p = (a.poinconType ?? "").toUpperCase();
    if (p === "ATELIER") row.getCell(2).value = "X";
    else if (p === "BOUTIQUE") row.getCell(3).value = "X";
    else if (p === "ENTREPRISE") row.getCell(4).value = "X";
    row.getCell(5).value = a.avsFund ?? null;
  });
  const lists: [number, string[]][] = [
    [7, distinctCrafts(actifs.map((x) => x.a.craft))],
    [11, sortFr([...new Set(actifs.map((x) => x.a.commune).filter((c): c is string => !!c))])],
    [13, sortFr(data.entities.filter((e) => e.type === ENTITY_TYPES.ecole).map((e) => e.name))],
    [15, sortFr(data.entities.filter((e) => e.type === ENTITY_TYPES.institution).map((e) => e.name))],
    [21, sortFr(data.entities.filter((e) => e.type === ENTITY_TYPES.association).map((e) => e.name))],
  ];
  for (const [col, values] of lists) values.forEach((v, i) => (ws.getCell(first + i, col).value = v));
  const last = Math.max(first, first + actifs.length - 1, ...lists.map(([, v]) => first + v.length - 1));
  for (const col of [1, 2, 3, 4, 5, 7, 11, 13, 15, 21]) setFormula(ws.getCell(16, col), countaFormula(colLetter(col), first, last));
  for (const col of [2, 3, 4]) setFormula(ws.getCell(15, col), `(${countaFormula(colLetter(col), first, last)})`);
  ws.getCell("A15").value = lastUpdateLabel(data.generatedAt);
}

/** Cartographies : une colonne par domaine (en-têtes du gabarit), listes dès la ligne 4. */
function fillCartography(ws: ExcelJS.Worksheet, data: ExportData, itemsOf: (categoryName: string) => string[]): void {
  const headers = new Map<string, number>();
  for (let c = 2; c <= 13; c++) {
    const v = ws.getCell(2, c).value;
    if (typeof v === "string" && v.trim()) headers.set(normalizeName(v), c);
  }
  clear(ws, 4, Math.max(ws.rowCount, 4), 2, 13);
  let lastRow = 4;
  const seen = new Set<number>();
  for (const cat of data.categories) {
    const col = headers.get(normalizeName(cartographyHeader(cat)));
    if (!col || seen.has(col)) continue;
    seen.add(col);
    const items = itemsOf(cat);
    items.forEach((name, i) => {
      const cell = ws.getCell(4 + i, col);
      cell.value = name;
      cell.alignment = { wrapText: true, vertical: "top" };
    });
    lastRow = Math.max(lastRow, 4 + items.length - 1);
  }
  for (let c = 2; c <= 13; c++) setFormula(ws.getCell(3, c), countaFormula(colLetter(c), 4, lastRow));
  setDate(ws.getCell("N2"), data.generatedAt);
}

function fillTrainers(ws: ExcelJS.Worksheet, data: ExportData): void {
  const rows = data.artisans
    .filter((a) => a.status === "actif" && a.trainerCompany !== null)
    .sort((a, b) => Number(b.trainerCompany) - Number(a.trainerCompany) || (a.lastName ?? a.ficheName ?? "").localeCompare(b.lastName ?? b.ficheName ?? "", "fr"));
  rows.forEach((a, i) => {
    const row = ws.getRow(4 + i);
    row.height = 55;
    row.getCell(1).value = a.trainerCompany ? "OUI" : "NON";
    row.getCell(2).value = excelDomaineLabel(a.categoryName);
    row.getCell(3).value = a.craft ?? null;
    row.getCell(4).value = excelSurname(a.lastName);
    row.getCell(5).value = a.firstName ?? null;
    row.getCell(6).value = a.workshopName ?? a.ficheName ?? null;
    row.getCell(7).value = a.trainerCompanyNote ?? null;
    for (let c = 1; c <= 7; c++) row.getCell(c).alignment = { wrapText: true, vertical: "top" };
  });
  const last = 4 + rows.length - 1;
  for (let c = 1; c <= 7; c++) setFormula(ws.getCell(2, c), countaFormula(colLetter(c), 4, last));
  ws.getCell("H2").value = lastUpdateLabel(data.generatedAt);
}

/** « Métiers » : un métier par ligne avec la plus ancienne date d'intégration connue. */
function fillCrafts(ws: ExcelJS.Worksheet, data: ExportData): void {
  const firstSeen = new Map<string, { label: string; date: string | null }>();
  for (const a of data.artisans) {
    if (a.status !== "actif") continue;
    for (const part of distinctCrafts([a.craft])) {
      const key = normalizeName(part);
      const cur = firstSeen.get(key);
      const date = a.integratedAt;
      if (!cur) firstSeen.set(key, { label: part, date });
      else if (date && (!cur.date || date < cur.date)) cur.date = date;
    }
  }
  const rows = [...firstSeen.values()].sort((x, y) => byDateDesc(x.date, y.date) || x.label.localeCompare(y.label, "fr"));
  rows.forEach((m, i) => {
    const row = ws.getRow(3 + i);
    row.height = 23;
    setDate(row.getCell(1), m.date);
    row.getCell(2).value = m.label;
  });
  setFormula(ws.getCell("B2"), countaFormula("B", 3, 3 + rows.length - 1));
  ws.getCell("D2").value = `Dernière MàJ : ${data.generatedAt.slice(8, 10)}.${data.generatedAt.slice(5, 7)}.${data.generatedAt.slice(0, 4)}`;
}

/** « Communes » : partenaires (B, dates gardées du gabarit) et comptes par commune (D-J). */
function fillCommunes(ws: ExcelJS.Worksheet, data: ExportData): void {
  // Dates d'adhésion des communes partenaires : lues dans le gabarit (colonne A), par nom.
  const known = new Map<string, ExcelJS.CellValue>();
  for (let r = 6; r <= ws.rowCount; r++) {
    const name = ws.getCell(r, 2).value;
    if (typeof name === "string" && name.trim()) known.set(normalizeName(name), ws.getCell(r, 1).value);
  }
  const partners = data.communes.filter((c) => c.soutientMag).map((c) => c.name);
  const lastPartnerRow = Math.max(25, 6 + partners.length - 1);
  clear(ws, 6, lastPartnerRow, 1, 2);
  partners.forEach((name, i) => {
    ws.getCell(6 + i, 2).value = name;
    const date = known.get(normalizeName(name));
    if (date !== undefined && date !== null) ws.getCell(6 + i, 1).value = date;
  });
  setFormula(ws.getCell("A5"), countaFormula("B", 6, 6 + partners.length - 1));
  setFormula(ws.getCell("B5"), countaFormula("B", 6, 6 + partners.length - 1));

  const all = sortFr(data.communes.map((c) => c.name));
  clear(ws, 7, Math.max(51, 7 + all.length - 1, ws.rowCount), 4, 10);
  const count = (commune: string, pred: (e: ExportEntity) => boolean) =>
    data.entities.filter((e) => e.commune && normalizeName(e.commune) === normalizeName(commune) && pred(e)).length;
  all.forEach((name, i) => {
    const r = 7 + i;
    ws.getCell(r, 4).value = name;
    const artisans = count(name, (e) => ARTISAN_TYPES.has(e.type));
    const institutions = count(name, (e) => e.type === ENTITY_TYPES.institution);
    const ecoles = count(name, (e) => e.type === ENTITY_TYPES.ecole);
    const assoc = count(name, (e) => e.type === ENTITY_TYPES.association);
    const partenaires = count(name, (e) => e.type === ENTITY_TYPES.partenaire);
    const total = artisans + institutions + ecoles + assoc + partenaires;
    const vals = [total, artisans, institutions, ecoles, assoc, partenaires];
    vals.forEach((v, j) => (ws.getCell(r, 5 + j).value = v > 0 ? v : null));
  });
  const last = 7 + all.length - 1;
  setFormula(ws.getCell("D6"), countaFormula("D", 7, last));
  setFormula(ws.getCell("E6"), countaFormula("E", 7, last));
  setFormula(ws.getCell("E5"), `(E6*100)/${all.length || 45}/100`);
  ws.getCell("C1").value = lastUpdateLabel(data.generatedAt);
}

// ─── Assemblage ─────────────────────────────────────────────────

export async function buildStatGlobales(data: ExportData, templatePath = TEMPLATE_PATH): Promise<Uint8Array<ArrayBuffer>> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const sheet = (name: string) => {
    const ws = wb.getWorksheet(name);
    if (!ws) throw new Error(`Gabarit : onglet « ${name} » introuvable`);
    return ws;
  };
  const actifs = data.artisans.filter((a) => a.status === "actif");
  const byCategory = (cat: string) => actifs.filter((a) => a.categoryName && normalizeName(a.categoryName) === normalizeName(cat));

  fillArtisans(sheet("Artisan·e·s"), data);
  fillGlobal(sheet("GLOBAL"), data);
  fillCartography(sheet("Cartographie artisans"), data, (cat) => sortFr(byCategory(cat).map((a) => a.ficheName ?? a.workshopName ?? globalName(a, null) ?? "").filter(Boolean)));
  fillCartography(sheet("Cartographie métiers"), data, (cat) => distinctCrafts(byCategory(cat).map((a) => a.craft)));
  fillTrainers(sheet("Entreprises formatrices"), data);
  fillCrafts(sheet("Métiers"), data);
  fillCommunes(sheet("Communes"), data);

  wb.calcProperties.fullCalcOnLoad = true;
  wb.modified = new Date();
  const out = await wb.xlsx.writeBuffer();
  return new Uint8Array(out as ArrayBuffer);
}

/** Nom du fichier téléchargé : Stat_GLOBALES_2026-10-10.xlsx */
export function statGlobalesFilename(generatedAt: string): string {
  return `Stat_GLOBALES_${generatedAt.slice(0, 10)}.xlsx`;
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
