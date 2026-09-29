import { NextResponse } from "next/server";
import { db } from "@/db";
import { medias } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { parseMediaInput } from "@/lib/actu-medias-input";

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

// PATCH /api/admin/medias/[id] — seuls les champs envoyés sont modifiés
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const parsed = parseMediaInput(await req.json().catch(() => null), "patch");
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const { id } = await params;
    const [updated] = await db
      .update(medias)
      .set(parsed.values)
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
