// Export Excel d'une commune (LOT A2) : artisans, écoles, institutions,
// associations et partenaires de la commune, pour appuyer une demande de
// soutien. Classeur simple généré de zéro (pas de gabarit).

import ExcelJS from "exceljs";
import type { CommuneView } from "./stats";
import { excelDate } from "./excel-export-rules";
import { slugify } from "./utils";
import { DOSSIER_STATUSES } from "./dossier-fields";

export async function buildCommuneWorkbook(view: CommuneView, generatedAt: string): Promise<Uint8Array<ArrayBuffer>> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Métiers d'Art Genève";
  const ws = wb.addWorksheet(view.commune.slice(0, 31));
  ws.columns = [
    { header: "Type", key: "type", width: 24 },
    { header: "Nom", key: "name", width: 48 },
    { header: "Métier", key: "craft", width: 36 },
    { header: "Domaine", key: "domaine", width: 36 },
    { header: "Statut", key: "status", width: 16 },
    { header: "Date d'intégration", key: "integratedAt", width: 18 },
  ];
  ws.getRow(1).font = { bold: true };
  const statusLabel = (s: string | null) => DOSSIER_STATUSES.find((x) => x.value === s)?.label ?? (s ?? "");
  for (const a of view.artisans) {
    const row = ws.addRow({ type: "Artisan·e", name: a.name, craft: a.craft ?? "", domaine: a.categoryName ?? "", status: statusLabel(a.status), integratedAt: excelDate(a.integratedAt) });
    if (a.integratedAt) row.getCell("integratedAt").numFmt = "dd.mm.yyyy";
  }
  const sections: [string, { name: string }[]][] = [
    ["École formatrice", view.ecoles],
    ["Institution culturelle", view.institutions],
    ["Association professionnelle", view.associations],
    ["Partenaire", view.partenaires],
  ];
  for (const [type, items] of sections) for (const it of items) ws.addRow({ type, name: it.name });
  ws.addRow({});
  ws.addRow({ type: "Total", name: `${view.artisans.length} artisan·e·s, ${view.ecoles.length} école(s), ${view.institutions.length} institution(s), ${view.associations.length} association(s), ${view.partenaires.length} partenaire(s)` }).font = { bold: true };
  ws.addRow({ type: "Généré le", name: generatedAt });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const out = await wb.xlsx.writeBuffer();
  return new Uint8Array(out as ArrayBuffer);
}

export function communeFilename(commune: string, generatedAt: string): string {
  return `Commune_${slugify(commune) || "commune"}_${generatedAt.slice(0, 10)}.xlsx`;
}
