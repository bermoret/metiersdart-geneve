import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisanDossiers, artisans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi, sessionAuthor } from "@/lib/admin";
import { DOSSIER_STATUSES, isUuid, sanitizeDossierPatch, type DossierStatus } from "@/lib/dossier-fields";
import { listDossiers } from "@/lib/dossiers-db";
import { resolveArtisanCommune } from "@/lib/artisan-commune";
import { splitAddress } from "@/lib/mag-excel";
import { isPgError } from "@/lib/pg-errors";

// GET /api/admin/dossiers?status=&q= — liste des dossiers artisans (onboarding)
export async function GET(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  if (status && !DOSSIER_STATUSES.some((s) => s.value === status)) {
    return NextResponse.json({ error: "Statut inconnu" }, { status: 400 });
  }
  const q = url.searchParams.get("q")?.slice(0, 100) ?? undefined;
  return NextResponse.json(await listDossiers({ status: status as DossierStatus | undefined, q }));
}

// POST /api/admin/dossiers — nouveau dossier (vide ou pré-rempli), ou dossier
// d'une fiche existante : { artisanId } (pré-rempli depuis la fiche, statut
// selon sa publication).
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const author = sessionAuthor(session);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Corps JSON attendu" }, { status: 400 });
  }

  if (body.artisanId !== undefined) {
    if (!isUuid(body.artisanId)) return NextResponse.json({ error: "artisanId invalide" }, { status: 400 });
    const [a] = await db.select().from(artisans).where(eq(artisans.id, body.artisanId)).limit(1);
    if (!a) return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });
    const [existing] = await db
      .select({ id: artisanDossiers.id })
      .from(artisanDossiers)
      .where(eq(artisanDossiers.artisanId, a.id))
      .limit(1);
    if (existing) return NextResponse.json({ error: "Cette fiche a déjà un dossier", id: existing.id }, { status: 409 });

    const addr = splitAddress(a.address);
    try {
      const [created] = await db
        .insert(artisanDossiers)
        .values({
          artisanId: a.id,
          status: a.published ? "actif" : "eligible",
          craft: a.craft,
          categoryId: a.categoryId,
          commune: a.commune,
          street: addr.street,
          postalCode: addr.postalCode,
          city: addr.city,
          phone: a.phone,
          email: a.email,
          contactPublicConsent: a.phone || a.email ? true : null,
          hasWebsite: a.website ? true : null,
          website: a.website,
          hasSocialMedia: a.socialLinks && Object.keys(a.socialLinks).length ? true : null,
          socialLinks: a.socialLinks,
          poinconType: a.poinconType,
          createdBy: author,
        })
        .returning({ id: artisanDossiers.id });
      return NextResponse.json({ id: created.id }, { status: 201 });
    } catch (e) {
      if (isPgError(e, "23505")) return NextResponse.json({ error: "Cette fiche a déjà un dossier" }, { status: 409 });
      throw e;
    }
  }

  const sanitized = sanitizeDossierPatch(body);
  if (!sanitized.ok) return NextResponse.json({ error: sanitized.error }, { status: 400 });
  const patch = sanitized.patch;
  if (typeof patch.commune === "string") {
    const r = await resolveArtisanCommune(patch.commune);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    patch.commune = r.commune ?? null;
  }
  try {
    const [created] = await db
      .insert(artisanDossiers)
      .values({ ...(patch as Partial<typeof artisanDossiers.$inferInsert>), createdBy: author })
      .returning({ id: artisanDossiers.id });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    if (isPgError(e, "23503")) return NextResponse.json({ error: "Domaine inconnu" }, { status: 400 });
    throw e;
  }
}
