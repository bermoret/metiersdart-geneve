import { NextResponse } from "next/server";
import { db } from "@/db";
import { communes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { OFFICIAL_COMMUNE_ERROR, officialCommuneName } from "@/lib/ge-commune-names";

// GET /api/admin/communes/[id] — une commune
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [row] = await db.select().from(communes).where(eq(communes.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/admin/communes/[id] — modifie une commune
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  // Renommer vers un nom sans tracé ferait retomber la commune en simple point
  // sur la carte : seuls les noms officiels (graphie tolérée via communeKey),
  // enregistrés sous leur forme officielle.
  let name: string | undefined;
  if (body.name !== undefined) {
    name = typeof body.name === "string" ? officialCommuneName(body.name) : undefined;
    if (!name) return NextResponse.json({ error: OFFICIAL_COMMUNE_ERROR }, { status: 400 });
  }

  const [updated] = await db
    .update(communes)
    .set({
      ...(name !== undefined && { name }),
      ...(body.soutientMag !== undefined && { soutientMag: body.soutientMag }),
      ...(body.latitude !== undefined && { latitude: Number(body.latitude) }),
      ...(body.longitude !== undefined && { longitude: Number(body.longitude) }),
      updatedAt: new Date(),
    })
    .where(eq(communes.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/admin/communes/[id] — supprime une commune
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(communes).where(eq(communes.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: deleted.id });
}
