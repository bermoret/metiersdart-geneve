import { NextResponse } from "next/server";
import { db } from "@/db";
import { jemaEditions, jemaParcours } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/jema/[id] — une édition
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;
    const [row] = await db.select().from(jemaEditions).where(eq(jemaEditions.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET jema/[id]:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/jema/[id] — modifie une édition
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(jemaEditions)
      .set({
        ...(body.year !== undefined && { year: Number(body.year) }),
        ...(body.title !== undefined && { title: String(body.title) }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.isUpcoming !== undefined && { isUpcoming: Boolean(body.isUpcoming) }),
        ...(body.isPast !== undefined && { isPast: Boolean(body.isPast) }),
        ...(body.description !== undefined && { description: body.description ? String(body.description) : null }),
        ...(body.programUrl !== undefined && { programUrl: body.programUrl ? String(body.programUrl) : null }),
        ...(body.stats !== undefined && { stats: body.stats ?? null }),
        updatedAt: new Date(),
      })
      .where(eq(jemaEditions.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH jema/[id]:", e);
    return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 });
  }
}

// DELETE /api/admin/jema/[id] — supprime une édition
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;

    // Vérifier si des parcours sont liés à cette édition
    const linkedParcours = await db
      .select()
      .from(jemaParcours)
      .where(eq(jemaParcours.editionId, id))
      .limit(1);

    if (linkedParcours.length > 0) {
      return NextResponse.json(
        { error: "Des parcours sont liés à cette édition. Supprimez-les d'abord." },
        { status: 409 },
      );
    }

    const [deleted] = await db.delete(jemaEditions).where(eq(jemaEditions.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: deleted.id });
  } catch (e) {
    console.error("DELETE jema/[id]:", e);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
