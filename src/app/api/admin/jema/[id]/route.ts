import { NextResponse } from "next/server";
import { db } from "@/db";
import { jemaEditions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/jema/[id] — une édition
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [row] = await db.select().from(jemaEditions).where(eq(jemaEditions.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/admin/jema/[id] — modifie une édition
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [updated] = await db
    .update(jemaEditions)
    .set({
      ...(body.year !== undefined && { year: body.year }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
      ...(body.isUpcoming !== undefined && { isUpcoming: body.isUpcoming }),
      ...(body.isPast !== undefined && { isPast: body.isPast }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.programUrl !== undefined && { programUrl: body.programUrl }),
      ...(body.stats !== undefined && { stats: body.stats }),
      updatedAt: new Date(),
    })
    .where(eq(jemaEditions.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/admin/jema/[id] — supprime une édition
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(jemaEditions).where(eq(jemaEditions.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: deleted.id });
}
