/**
 * Gabarit de l'export Excel (LOT A2) : à partir du classeur de MAG
 * (docs/mag-inputs/Stat_GLOBALES.xlsx, exclu de git par .gitignore et par le
 * test src/lib/repo-hygiene.test.ts), produit
 * src/data/stat-globales-template.xlsx, VIDÉ des données personnelles mais
 * conservant onglets, titres, en-têtes, formules de comptage, fusions,
 * largeurs et formats. L'export (src/lib/excel-export.ts) remplit ensuite les
 * onglets issus de la base. Onglets vidés : « Artisan·e·s » (lignes de données
 * et section « Retiré du répertoire »), « GLOBAL » (colonnes A-E : noms,
 * poinçon, caisse AVS), « Cartographie artisans », « Cartographie métiers »,
 * « Entreprises formatrices », « Métiers », « Mailing artisans », et les
 * colonnes téléphone / mail / adresse de « Partenaire ». Les autres onglets
 * (listes historiques, INMA, ASMA, RECAP, Capsules…) sont gardés tels quels :
 * ils ne contiennent que des noms publics et des chiffres.
 *
 * Un contrôle final refuse le gabarit s'il reste une adresse e-mail ou un
 * numéro de téléphone dans une cellule.
 *
 * Usage : npx tsx scripts/build-excel-template.ts [--in <xlsx>] [--out <xlsx>]
 */
import ExcelJS from "exceljs";
import { argValue } from "./lib/db-script";

const IN = argValue("--in") ?? "docs/mag-inputs/Stat_GLOBALES.xlsx";
const OUT = argValue("--out") ?? "src/data/stat-globales-template.xlsx";

/** Vide les cellules d'une plage (valeur seulement : style conservé). */
function clearRange(ws: ExcelJS.Worksheet, fromRow: number, toRow: number, fromCol: number, toCol: number): number {
  let n = 0;
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      const cell = ws.getCell(r, c);
      if (cell.value !== null && cell.value !== undefined) {
        cell.value = null;
        n++;
      }
    }
  }
  return n;
}

/**
 * Supprime les lignes de `fromRow` à la fin. Une à la fois depuis le bas :
 * `spliceRows(début, n)` en bloc ne retire rien dans exceljs 4.4 (constaté).
 */
function spliceToEnd(ws: ExcelJS.Worksheet, fromRow: number): number {
  const last = ws.rowCount;
  for (let r = last; r >= fromRow; r--) ws.spliceRows(r, 1);
  return Math.max(0, last - fromRow + 1);
}

/** Retire toutes les fusions sauf celles listées. */
function keepMerges(ws: ExcelJS.Worksheet, keep: string[]): void {
  const merges = [...(ws.model.merges ?? [])];
  for (const m of merges) if (!keep.includes(m)) ws.unMergeCells(m);
}

/** Texte d'une cellule texte (nombres et dates ignorés : un décimal n'est pas un téléphone). */
function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined || v instanceof Date || typeof v === "number" || typeof v === "boolean") return "";
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("text" in v) return String(v.text ?? "");
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    return "";
  }
  return String(v);
}

async function main(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(IN);
  const log: string[] = [];
  const sheet = (name: string) => {
    const ws = wb.getWorksheet(name);
    if (!ws) throw new Error(`Onglet « ${name} » introuvable dans ${IN}`);
    return ws;
  };

  // Artisan·e·s : titre, formules, en-têtes gardés ; données, séparateur, retirés supprimés.
  {
    const ws = sheet("Artisan·e·s");
    keepMerges(ws, ["B1:J1"]);
    log.push(`Artisan·e·s : ${spliceToEnd(ws, 4)} lignes supprimées`);
  }
  // GLOBAL : colonnes A-E (noms, poinçon, caisse AVS) vidées dès la ligne 17.
  {
    const ws = sheet("GLOBAL");
    log.push(`GLOBAL : ${clearRange(ws, 17, ws.rowCount, 1, 5)} cellules vidées (A-E)`);
  }
  // Cartographies : listes par domaine vidées, fusions de remplissage retirées.
  for (const name of ["Cartographie artisans", "Cartographie métiers"]) {
    const ws = sheet(name);
    keepMerges(ws, ["A1:M1"]);
    log.push(`${name} : ${spliceToEnd(ws, 4)} lignes supprimées`);
  }
  {
    const ws = sheet("Entreprises formatrices");
    keepMerges(ws, ["A1:G1"]);
    log.push(`Entreprises formatrices : ${spliceToEnd(ws, 4)} lignes supprimées`);
  }
  {
    const ws = sheet("Métiers");
    keepMerges(ws, ["A1:B1"]);
    log.push(`Métiers : ${spliceToEnd(ws, 3)} lignes supprimées`);
  }
  {
    const ws = sheet("Mailing artisans");
    log.push(`Mailing artisans : ${spliceToEnd(ws, 3)} lignes supprimées`);
  }
  {
    const ws = sheet("Partenaire");
    log.push(`Partenaire : ${clearRange(ws, 4, ws.rowCount, 3, 5)} cellules vidées (téléphone, mail, adresse)`);
  }

  // Notes de cellule (commentaires Excel) : retirées partout, elles portent
  // des remarques nominatives. Onglet historique « GLOBAL au 30.03.23 » :
  // noms gardés (publics), remarques personnelles effacées.
  const SENSITIVE = /retrait|faillite|liquidation|d[ée]c[èe]s|d[ée]c[ée]d|parti[e]? |maladie|divorce|suspens/i;
  let notes = 0;
  let remarks = 0;
  for (const ws of wb.worksheets) {
    // includeEmpty : une note peut être accrochée à une cellule sans valeur.
    ws.eachRow({ includeEmpty: true }, (row) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (cell.note) {
          cell.note = undefined as unknown as string;
          notes++;
        }
        if (ws.name === "GLOBAL au 30.03.23" && SENSITIVE.test(cellText(cell.value))) {
          cell.value = null;
          remarks++;
        }
      });
    });
  }
  log.push(`Notes de cellule retirées : ${notes} ; remarques effacées dans « GLOBAL au 30.03.23 » : ${remarks}`);
  // Métadonnées du classeur : plus de nom de personne.
  wb.creator = "Métiers d'Art Genève";
  wb.lastModifiedBy = "Métiers d'Art Genève";
  wb.company = "Métiers d'Art Genève";

  // Contrôle : plus aucune adresse e-mail ni numéro de téléphone nulle part (notes comprises).
  const offenders: string[] = [];
  const emailRe = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  const phoneRe = /(?:\+41|0)\s?\d{2}[\s.]?\d{3}[\s.]?\d{2}[\s.]?\d{2}/;
  for (const ws of wb.worksheets) {
    ws.eachRow({ includeEmpty: false }, (row, r) => {
      row.eachCell({ includeEmpty: false }, (cell, c) => {
        const t = cellText(cell.value) + " " + (typeof cell.note === "string" ? cell.note : cell.note ? JSON.stringify(cell.note) : "");
        if (emailRe.test(t) || phoneRe.test(t)) offenders.push(`${ws.name}!${ws.getColumn(c).letter}${r} : ${t.slice(0, 40)}`);
      });
    });
  }
  if (offenders.length) {
    console.error("Données personnelles résiduelles, gabarit refusé :\n  " + offenders.join("\n  "));
    process.exit(1);
  }

  wb.calcProperties.fullCalcOnLoad = true;
  await wb.xlsx.writeFile(OUT);
  console.log(log.join("\n"));
  console.log(`Gabarit écrit : ${OUT} (${wb.worksheets.length} onglets)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
