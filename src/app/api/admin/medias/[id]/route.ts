import { NextResponse } from "next/server";
import { db } from "@/db";
import { medias } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/medias/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [row] = await db.select().from(medias).where(eq(medias.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/admin/medias/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [updated] = await db
    .update(medias)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.mediaType !== undefined && { mediaType: body.mediaType }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
      ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl || null }),
      ...(body.externalUrl !== undefined && { externalUrl: body.externalUrl || null }),
      ...(body.pdfUrl !== undefined && { pdfUrl: body.pdfUrl || null }),
      ...(body.date !== undefined && { date: body.date ? new Date(body.date) : null }),
      ...(body.source !== undefined && { source: body.source }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    })
    .where(eq(medias.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/admin/medias/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(medias).where(eq(medias.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: deleted.id });
}
