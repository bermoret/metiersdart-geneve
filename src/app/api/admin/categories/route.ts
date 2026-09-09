import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin";

// GET /api/admin/categories — liste toutes les catégories
export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const all = await db.select().from(categories).orderBy(categories.sortOrder);
    return NextResponse.json(all);
  } catch (e) {
    console.error("GET categories:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/admin/categories — crée une catégorie
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    const name = String(body.name);
    const [created] = await db
      .insert(categories)
      .values({
        name,
        slug: body.slug ? String(body.slug) : slugify(name),
        description: body.description ? String(body.description) : null,
        icon: body.icon ? String(body.icon) : null,
        color: body.color ? String(body.color) : null,
        sortOrder: Number(body.sortOrder) || 0,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST categories:", e);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
