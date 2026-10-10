import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { buildStatGlobales, statGlobalesFilename, XLSX_MIME } from "@/lib/excel-export";
import { loadExportData } from "@/lib/stats-db";

export const dynamic = "force-dynamic";

// GET /api/admin/export/stat-globales — le classeur Stat_GLOBALES au format de
// MAG, régénéré depuis la base (onglets artisans, GLOBAL, cartographies,
// entreprises formatrices, métiers, communes), à télécharger.
export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  try {
    const data = await loadExportData();
    const buffer = await buildStatGlobales(data);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="${statGlobalesFilename(data.generatedAt)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("GET export/stat-globales:", e);
    return NextResponse.json({ error: "Export impossible" }, { status: 500 });
  }
}
