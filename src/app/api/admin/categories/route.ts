import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, artisans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/categories — liste toutes les catégories
export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const all = await db.select().from(categories).orderBy(categories.sortOrder);
  return NextResponse.json(all);
}

// POST /api/admin/categories — crée une catégorie
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const [created] = await db
    .insert(categories)
    .values({
      name: body.name,
      slug: body.slug || slugify(body.name),
      description: body.description,
      icon: body.icon,
      color: body.color,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
