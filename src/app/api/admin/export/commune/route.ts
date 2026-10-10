import { NextResponse } from "next/server";
import { db } from "@/db";
import { communes } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin";
import { findCommuneName } from "@/lib/commune-match";
import { buildCommuneWorkbook, communeFilename } from "@/lib/commune-export";
import { XLSX_MIME } from "@/lib/excel-export";
import { getCommuneView } from "@/lib/stats-db";
import { todayZurich } from "@/lib/dossier-rules";

export const dynamic = "force-dynamic";

// GET /api/admin/export/commune?commune=Lancy — fiches publiées d'une commune (Excel)
export async function GET(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const raw = new URL(req.url).searchParams.get("commune") ?? "";
  const names = (await db.select({ name: communes.name }).from(communes)).map((c) => c.name);
  const commune = findCommuneName(raw.slice(0, 100), names);
  if (!commune) return NextResponse.json({ error: "Commune inconnue" }, { status: 400 });
  try {
    const generatedAt = todayZurich();
    const buffer = await buildCommuneWorkbook(await getCommuneView(commune), generatedAt);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="${communeFilename(commune, generatedAt)}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("GET export/commune:", e);
    return NextResponse.json({ error: "Export impossible" }, { status: 500 });
  }
}
