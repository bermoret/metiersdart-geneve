import { NextResponse } from "next/server";
import { db } from "@/db";
import { annonces } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { isUuid } from "@/lib/utils";
import { discardAnnoncePhoto, storeAnnoncePhoto } from "@/lib/annonces-photo";

// POST /api/admin/annonces/[id]/photo — remplace la photo (multipart, champ « photo »)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const [current] = await db.select({ imageUrl: annonces.imageUrl }).from(annonces).where(eq(annonces.id, id)).limit(1);
  if (!current) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const fd = await req.formData().catch(() => null);
  const photo = fd?.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return NextResponse.json({ error: "Aucune photo" }, { status: 400 });

  let stored: Awaited<ReturnType<typeof storeAnnoncePhoto>>;
  try {
    stored = await storeAnnoncePhoto(photo);
  } catch (e) {
    console.error("POST annonces/photo:", e);
    return NextResponse.json({ error: "Dépôt de la photo impossible" }, { status: 502 });
  }
  if ("error" in stored) return NextResponse.json({ error: stored.error }, { status: 400 });

  const [updated] = await db
    .update(annonces)
    .set({ imageUrl: stored.url, updatedAt: sql`now()` })
    .where(eq(annonces.id, id))
    .returning();
  if (!updated) {
    await discardAnnoncePhoto(stored.url);
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  await discardAnnoncePhoto(current.imageUrl);
  return NextResponse.json(updated);
}
