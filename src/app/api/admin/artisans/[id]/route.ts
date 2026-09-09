import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/artisans/[id] — un artisan
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [row] = await db
    .select({
      id: artisans.id,
      name: artisans.name,
      slug: artisans.slug,
      type: artisans.type,
      craft: artisans.craft,
      commune: artisans.commune,
      published: artisans.published,
      categoryId: artisans.categoryId,
      categoryName: categories.name,
      address: artisans.address,
      latitude: artisans.latitude,
      longitude: artisans.longitude,
      phone: artisans.phone,
      email: artisans.email,
      website: artisans.website,
      shortDescription: artisans.shortDescription,
      longDescription: artisans.longDescription,
      imageUrl: artisans.imageUrl,
    })
    .from(artisans)
    .leftJoin(categories, eq(artisans.categoryId, categories.id))
    .where(eq(artisans.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH /api/admin/artisans/[id] — modifie un artisan
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  let categoryId = body.categoryId;
  if (categoryId === undefined && body.categoryName) {
    const cat = await db
      .select()
      .from(categories)
      .where(eq(categories.name, body.categoryName))
      .limit(1);
    if (cat[0]) categoryId = cat[0].id;
  }

  const [updated] = await db
    .update(artisans)
    .set({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.craft !== undefined && { craft: body.craft }),
      ...(categoryId !== undefined && { categoryId }),
      ...(body.commune !== undefined && { commune: body.commune }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.latitude !== undefined && { latitude: body.latitude ? Number(body.latitude) : null }),
      ...(body.longitude !== undefined && { longitude: body.longitude ? Number(body.longitude) : null }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.shortDescription !== undefined && { shortDescription: body.shortDescription }),
      ...(body.longDescription !== undefined && { longDescription: body.longDescription }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.published !== undefined && { published: body.published }),
      updatedAt: new Date(),
    })
    .where(eq(artisans.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/admin/artisans/[id] — supprime un artisan
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(artisans).where(eq(artisans.id, id)).returning();

  if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: deleted.id });
}
