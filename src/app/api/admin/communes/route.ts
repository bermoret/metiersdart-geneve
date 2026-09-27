import { NextResponse } from "next/server";
import { db } from "@/db";
import { communes } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin";
import { OFFICIAL_COMMUNE_ERROR, officialCommuneName } from "@/lib/ge-commune-names";

// GET /api/admin/communes — liste toutes les communes
export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const all = await db
    .select()
    .from(communes)
    .orderBy(communes.name);

  return NextResponse.json(all);
}

// POST /api/admin/communes — crée une commune
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }
  // Un nom sans tracé sur la carte ferait retomber la commune en simple point.
  // On enregistre le nom officiel (« Vandœuvres » → « Vandoeuvres ») : c'est
  // lui que les artisans et la carte comparent.
  const name = typeof body.name === "string" ? officialCommuneName(body.name) : undefined;
  if (!name) {
    return NextResponse.json({ error: OFFICIAL_COMMUNE_ERROR }, { status: 400 });
  }

  const [created] = await db
    .insert(communes)
    .values({
      name,
      slug: body.slug || slugify(name),
      latitude: body.latitude ? Number(body.latitude) : null,
      longitude: body.longitude ? Number(body.longitude) : null,
      soutientMag: body.soutientMag ?? false,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
