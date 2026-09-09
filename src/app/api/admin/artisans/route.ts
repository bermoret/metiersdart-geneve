import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisans, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/artisans — liste tous les artisans
export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const all = await db
    .select({
      id: artisans.id,
      name: artisans.name,
      slug: artisans.slug,
      type: artisans.type,
      craft: artisans.craft,
      commune: artisans.commune,
      published: artisans.published,
      categoryName: categories.name,
    })
    .from(artisans)
    .leftJoin(categories, eq(artisans.categoryId, categories.id))
    .orderBy(artisans.name);

  return NextResponse.json(all);
}

// POST /api/admin/artisans — crée un artisan
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();

  // Trouver la catégorie par nom si categoryId n'est pas fourni
  let categoryId = body.categoryId;
  if (!categoryId && body.categoryName) {
    const cat = await db
      .select()
      .from(categories)
      .where(eq(categories.name, body.categoryName))
      .limit(1);
    if (cat[0]) categoryId = cat[0].id;
  }

  const [created] = await db
    .insert(artisans)
    .values({
      name: body.name,
      slug: body.slug || slugify(body.name),
      type: body.type || "artisan",
      craft: body.craft,
      categoryId,
      commune: body.commune,
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
      phone: body.phone,
      email: body.email,
      website: body.website,
      shortDescription: body.shortDescription,
      longDescription: body.longDescription,
      imageUrl: body.imageUrl,
      published: body.published ?? true,
      jemaParticipant: body.jemaParticipant ?? true,
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
