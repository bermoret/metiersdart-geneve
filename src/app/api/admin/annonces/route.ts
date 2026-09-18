import { NextResponse } from "next/server";
import { db } from "@/db";
import { annonces } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

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

  const body = await req.json();
  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "Titre et contenu requis" }, { status: 400 });
  }

  const [annonce] = await db
    .insert(annonces)
    .values({
      title: body.title.trim().slice(0, 500),
      category: body.category?.trim() || "Entraide",
      authorName: body.authorName?.trim() || "MAG",
      authorEmail: body.authorEmail?.trim() || null,
      content: body.content.trim(),
      status: body.status || "pending",
      publishedAt: body.status === "published" ? sql`now()` : null,
    })
    .returning();

  return NextResponse.json(annonce, { status: 201 });
}
