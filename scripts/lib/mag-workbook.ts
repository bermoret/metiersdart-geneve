/**
 * Lecture du classeur de MAG (Stat_GLOBALES.xlsx) : onglet « Artisan·e·s »
 * (une ligne par artisan·e, section « Retiré du répertoire ») et onglet
 * « GLOBAL » (poinçon, caisse AVS). Partagé par import-excel-mag.ts et
 * check-excel-vs-db.ts. Règles de cellule : src/lib/mag-excel.ts.
 */
import ExcelJS from "exceljs";
import { cellToIsoDate, normalizeName, poinconFromGlobal, type ExcelArtisanRow } from "../../src/lib/mag-excel";

export const SHEET_ARTISANS = "Artisan·e·s";
export const SHEET_GLOBAL = "GLOBAL";

/** Texte d'une cellule exceljs (texte riche, lien, formule, date, nombre) ; « - » = vide. */
export function cellText(v: ExcelJS.CellValue): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("").trim() || null;
    if ("text" in v) return cellText(v.text as ExcelJS.CellValue);
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    return null;
  }
  const s = String(v).trim();
  return s && s !== "-" ? s : null;
}

function cellRaw(v: ExcelJS.CellValue): unknown {
  if (v && typeof v === "object" && !(v instanceof Date) && "result" in v) return v.result;
  return v;
}

export type GlobalInfo = { poincon: "ATELIER" | "BOUTIQUE" | "ENTREPRISE" | null; avsFund: string | null; name: string };

export async function readMagWorkbook(file: string): Promise<{ rows: ExcelArtisanRow[]; global: GlobalInfo[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet(SHEET_ARTISANS);
  if (!ws) throw new Error(`Onglet « ${SHEET_ARTISANS} » introuvable dans ${file}`);
  const header = ws.getRow(3);
  const expect: Record<number, string> = { 1: "Commune", 2: "DATE INTÉGRATION", 3: "DOMAINE", 4: "METIER", 5: "NOM", 6: "PRÉNOM", 7: "RAISON SOCIALE", 8: "TÉLÉPHONE", 9: "MAIL", 10: "ADRESSE", 11: "COMMENTAIRES", 12: "ENTREPRISE FORMATRICE" };
  for (const [col, label] of Object.entries(expect)) {
    const got = cellText(header.getCell(Number(col)).value);
    if (normalizeName(got) !== normalizeName(label)) throw new Error(`Colonne ${col} de « ${SHEET_ARTISANS} » : « ${got} » attendu « ${label} » (structure du classeur changée ?)`);
  }
  const rows: ExcelArtisanRow[] = [];
  let retired = false;
  ws.eachRow((row, n) => {
    if (n < 4) return;
    const t = (c: number) => cellText(row.getCell(c).value);
    // Séparateur « Retiré du répertoire » (même libellé répété sur la ligne)
    const marker = [t(1), t(5), t(6)].filter(Boolean);
    if (marker.length >= 2 && marker.every((m) => /retir/i.test(m!))) {
      retired = true;
      return;
    }
    const r: ExcelArtisanRow = {
      rowNumber: n,
      commune: t(1),
      integratedAt: cellToIsoDate(cellRaw(row.getCell(2).value)),
      domaine: t(3),
      craft: t(4),
      lastName: t(5),
      firstName: t(6),
      workshopName: t(7),
      phone: t(8),
      email: t(9),
      address: t(10),
      comment: t(11),
      trainerCompany: t(12),
      retired,
    };
    if (r.lastName || r.firstName || r.workshopName) rows.push(r);
  });

  const global: GlobalInfo[] = [];
  const wg = wb.getWorksheet(SHEET_GLOBAL);
  if (wg) {
    wg.eachRow((row, n) => {
      if (n < 17) return;
      const name = cellText(row.getCell(1).value);
      if (!name) return;
      global.push({
        name,
        poincon: poinconFromGlobal(cellText(row.getCell(2).value), cellText(row.getCell(3).value), cellText(row.getCell(4).value)),
        avsFund: cellText(row.getCell(5).value),
      });
    });
  }
  return { rows, global };
}
