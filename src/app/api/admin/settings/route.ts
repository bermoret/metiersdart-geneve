import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { parseCount } from "@/lib/utils";

const DEFAULT_ID = "default";

// GET /api/admin/settings — récupère les paramètres du site
export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // SELECT simple : si la ligne n'existe pas (seed pas encore lancé),
  // on retourne des valeurs par défaut sans l'upserter — sinon le seed
  // avec onConflictDoNothing ne pourrait plus écrire communautePassword.
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, DEFAULT_ID))
    .limit(1);

  if (!row) {
    return NextResponse.json({
      id: DEFAULT_ID,
      eventsCount: 0,
      craftsCount: null,
      communautePassword: null,
    });
  }

  return NextResponse.json(row);
}

// PUT /api/admin/settings — met à jour les paramètres du site
export async function PUT(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Mise à jour partielle : seuls les champs envoyés sont modifiés (enregistrer
  // le mot de passe Communauté remettait le nombre de projets à 0).
  const eventsCount = parseCount(body.eventsCount);
  const craftsCount = parseCount(body.craftsCount);
  if (eventsCount === null || craftsCount === null) {
    return NextResponse.json({ error: "Les chiffres doivent être des entiers positifs" }, { status: 400 });
  }

  const communautePassword =
    typeof body.communautePassword === "string" && body.communautePassword.trim()
      ? body.communautePassword.trim().slice(0, 255)
      : undefined;
  if (eventsCount === undefined && craftsCount === undefined && communautePassword === undefined) {
    return NextResponse.json({ error: "Aucun paramètre à modifier" }, { status: 400 });
  }

  const [row] = await db
    .insert(siteSettings)
    .values({
      id: DEFAULT_ID,
      eventsCount: eventsCount ?? 0,
      ...(craftsCount !== undefined ? { craftsCount } : {}),
      ...(communautePassword !== undefined ? { communautePassword } : {}),
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        ...(eventsCount !== undefined ? { eventsCount } : {}),
        ...(craftsCount !== undefined ? { craftsCount } : {}),
        ...(communautePassword !== undefined ? { communautePassword } : {}),
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return NextResponse.json(row);
}

