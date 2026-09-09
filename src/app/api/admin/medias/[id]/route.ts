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

  try {
    const { id } = await params;
    const [row] = await db.select().from(medias).where(eq(medias.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET medias/[id]:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/medias/[id]
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
      .update(medias)
      .set({
        ...(body.title !== undefined && { title: String(body.title) }),
        ...(body.type !== undefined && { type: String(body.type) }),
        ...(body.mediaType !== undefined && { mediaType: body.mediaType ? String(body.mediaType) : null }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.videoUrl !== undefined && { videoUrl: body.videoUrl ? String(body.videoUrl) : null }),
        ...(body.externalUrl !== undefined && { externalUrl: body.externalUrl ? String(body.externalUrl) : null }),
        ...(body.pdfUrl !== undefined && { pdfUrl: body.pdfUrl ? String(body.pdfUrl) : null }),
        ...(body.date !== undefined && { date: body.date ? new Date(body.date) : null }),
        ...(body.source !== undefined && { source: body.source ? String(body.source) : null }),
        ...(body.description !== undefined && { description: body.description ?? null }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
      })
      .where(eq(medias.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH medias/[id]:", e);
    return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 });
  }
}

// DELETE /api/admin/medias/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;
    const [deleted] = await db.delete(medias).where(eq(medias.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: deleted.id });
  } catch (e) {
    console.error("DELETE medias/[id]:", e);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
