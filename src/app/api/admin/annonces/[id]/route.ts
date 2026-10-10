import { NextResponse } from "next/server";
import { db } from "@/db";
import { annonces, type annonceStatusEnum } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { isUuid } from "@/lib/utils";
import { parseAnnonceEdit } from "@/lib/annonces";
import { discardAnnoncePhoto } from "@/lib/annonces-photo";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES = ["pending", "published", "rejected"] as const;

// PATCH /api/admin/annonces/[id] — modère (status) et/ou modifie (titre,
// catégorie, contenu, auteur, e-mail) une annonce ; { imageUrl: null } retire la photo.
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps JSON attendu" }, { status: 400 });

  const status = body.status as string | undefined;
  if (status !== undefined && !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }
  const edit = parseAnnonceEdit(body);
  if (!edit.ok) return NextResponse.json({ error: edit.error }, { status: 400 });
  const removePhoto = body.imageUrl === null;
  if (status === undefined && !Object.keys(edit.patch).length && !removePhoto) {
    return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });
  }

  const [current] = await db.select({ imageUrl: annonces.imageUrl }).from(annonces).where(eq(annonces.id, id)).limit(1);
  if (!current) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const [updated] = await db
    .update(annonces)
    .set({
      ...edit.patch,
      ...(status !== undefined ? { status: status as (typeof annonceStatusEnum.enumValues)[number] } : {}),
      ...(status === "published" ? { publishedAt: sql`now()` } : {}),
      ...(removePhoto ? { imageUrl: null } : {}),
      updatedAt: sql`now()`,
    })
    .where(eq(annonces.id, id))
    .returning();
  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (removePhoto) await discardAnnoncePhoto(current.imageUrl);
  return NextResponse.json(updated);
}

// DELETE /api/admin/annonces/[id] — supprime une annonce et sa photo
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const [deleted] = await db.delete(annonces).where(eq(annonces.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  await discardAnnoncePhoto(deleted.imageUrl);
  return NextResponse.json({ ok: true, deleted: deleted.id });
}
