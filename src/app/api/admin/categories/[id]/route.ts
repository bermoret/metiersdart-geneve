import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, artisans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/categories/[id] — une catégorie
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;
    const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET categories/[id]:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/categories/[id] — modifie une catégorie
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
      .update(categories)
      .set({
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.slug !== undefined && { slug: String(body.slug) }),
        ...(body.description !== undefined && { description: body.description ? String(body.description) : null }),
        ...(body.icon !== undefined && { icon: body.icon ? String(body.icon) : null }),
        ...(body.color !== undefined && { color: body.color ? String(body.color) : null }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("PATCH categories/[id]:", e);
    return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[id] — supprime une catégorie
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;

    // Vérifier si des artisans sont liés à cette catégorie
    const linkedArtisans = await db
      .select()
      .from(artisans)
      .where(eq(artisans.categoryId, id))
      .limit(1);

    if (linkedArtisans.length > 0) {
      return NextResponse.json(
        { error: "Des artisans sont liés à cette catégorie. Déplacez-les d'abord." },
        { status: 409 },
      );
    }

    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: deleted.id });
  } catch (e) {
    console.error("DELETE categories/[id]:", e);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
