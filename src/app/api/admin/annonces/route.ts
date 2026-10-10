import { NextResponse } from "next/server";
import { db } from "@/db";
import { annonces } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { isAnnonceCategory, parseAnnonceInput } from "@/lib/annonces";

// GET /api/admin/annonces — liste toutes les annonces (tous statuts)
export async function GET(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  let query = db.select().from(annonces).orderBy(desc(annonces.createdAt));
  if (statusFilter && ["pending", "published", "rejected"].includes(statusFilter)) {
    query = db.select().from(annonces).where(eq(annonces.status, statusFilter as never)).orderBy(desc(annonces.createdAt)) as typeof query;
  }

  const rows = await query;
  return NextResponse.json(rows);
}

// POST /api/admin/annonces — crée une annonce directement (admin)
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  // Mêmes règles qu'une soumission de membre (catégorie de la liste, bornes) ;
  // auteur et catégorie ont une valeur par défaut côté admin.
  const parsed = parseAnnonceInput({
    ...body,
    category: isAnnonceCategory(body?.category) ? body.category : "Entraide",
    authorName: typeof body?.authorName === "string" && body.authorName.trim() ? body.authorName : "MAG",
  });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const status = body?.status === "published" || body?.status === "rejected" ? body.status : "pending";

  const [annonce] = await db
    .insert(annonces)
    .values({
      ...parsed.value,
      status,
      publishedAt: status === "published" ? sql`now()` : null,
    })
    .returning();

  return NextResponse.json(annonce, { status: 201 });
}
