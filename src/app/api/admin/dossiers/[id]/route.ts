import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisanDocuments, artisanDossiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { isUuid, sanitizeDossierPatch } from "@/lib/dossier-fields";
import { getDossier } from "@/lib/dossiers-db";
import { resolveArtisanCommune } from "@/lib/artisan-commune";
import { isPgError } from "@/lib/pg-errors";
import { del } from "@vercel/blob";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/dossiers/[id] — dossier, fiche liée, pièces, journal
export async function GET(_req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const detail = await getDossier(id);
  if (!detail) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(detail);
}

// PATCH /api/admin/dossiers/[id] — champs du formulaire (brouillon auto-enregistré).
// Statut, dates de sortie et fiche liée ne changent que par /actions.
export async function PATCH(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const sanitized = sanitizeDossierPatch(body);
  if (!sanitized.ok) return NextResponse.json({ error: sanitized.error }, { status: 400 });
  const patch = sanitized.patch;
  if (typeof patch.commune === "string") {
    const r = await resolveArtisanCommune(patch.commune);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    patch.commune = r.commune ?? null;
  }

  try {
    const [updated] = await db
      .update(artisanDossiers)
      .set({ ...(patch as Partial<typeof artisanDossiers.$inferInsert>), updatedAt: new Date() })
      .where(eq(artisanDossiers.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    if (isPgError(e, "23503")) return NextResponse.json({ error: "Domaine inconnu" }, { status: 400 });
    throw e;
  }
}

// DELETE /api/admin/dossiers/[id] — seulement un dossier sans fiche liée
// (créé par erreur). Un dossier lié se désactive, il ne se supprime pas.
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const [d] = await db.select({ artisanId: artisanDossiers.artisanId }).from(artisanDossiers).where(eq(artisanDossiers.id, id)).limit(1);
  if (!d) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (d.artisanId) {
    return NextResponse.json({ error: "Ce dossier est lié à une fiche : désactivez-le plutôt que de le supprimer." }, { status: 409 });
  }
  // Les pièces (blobs privés) partent avec le dossier : Blob d'abord, puis la
  // ligne (en cascade sur artisan_documents). Si Blob refuse, rien n'est supprimé.
  const docs = await db.select({ pathname: artisanDocuments.pathname }).from(artisanDocuments).where(eq(artisanDocuments.dossierId, id));
  if (docs.length) {
    try {
      await del(docs.map((d) => d.pathname));
    } catch (e) {
      console.error("DELETE dossier blobs:", e);
      return NextResponse.json({ error: "Suppression des pièces impossible dans le stockage, réessayez." }, { status: 502 });
    }
  }
  await db.delete(artisanDossiers).where(eq(artisanDossiers.id, id));
  return NextResponse.json({ ok: true });
}
