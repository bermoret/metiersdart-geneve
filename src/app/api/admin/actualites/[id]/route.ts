import { NextResponse } from "next/server";
import { db } from "@/db";
import { actualites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/actualites/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [row] = await db.select().from(actualites).where(eq(actualites.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/admin/actualites/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [updated] = await db
    .update(actualites)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.excerpt !== undefined && { excerpt: body.excerpt }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.eventDate !== undefined && { eventDate: body.eventDate ? new Date(body.eventDate) : null }),
      ...(body.eventEndDate !== undefined && { eventEndDate: body.eventEndDate ? new Date(body.eventEndDate) : null }),
      ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
      ...(body.published !== undefined && { published: body.published }),
      updatedAt: new Date(),
    })
    .where(eq(actualites.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/admin/actualites/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(actualites).where(eq(actualites.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: deleted.id });
}
