import { NextResponse } from "next/server";
import { db } from "@/db";
import { annonces, type annonceStatusEnum } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

// PATCH /api/admin/annonces/[id] — modère une annonce (publish/reject)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const status = body.status as string | undefined;
  if (!status || !["pending", "published", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const validStatus = status as typeof annonceStatusEnum.enumValues[number];

  const [updated] = await db
    .update(annonces)
    .set({
      status: validStatus,
      ...(status === "published" ? { publishedAt: sql`now()` } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(annonces.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}

// DELETE /api/admin/annonces/[id] — supprime une annonce
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(annonces).where(eq(annonces.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, deleted: deleted.id });
}
