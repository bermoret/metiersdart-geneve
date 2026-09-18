import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

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
      communautePassword: null,
    });
  }

  return NextResponse.json(row);
}

// PUT /api/admin/settings — met à jour les paramètres du site
export async function PUT(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();

  // Validation : eventsCount doit être un entier >= 0
  const rawEvents = Number(body.eventsCount);
  const eventsCount =
    Number.isFinite(rawEvents) && rawEvents >= 0 ? Math.floor(rawEvents) : 0;

  const communautePassword =
    typeof body.communautePassword === "string" && body.communautePassword.trim()
      ? body.communautePassword.trim().slice(0, 255)
      : undefined;

  const [row] = await db
    .insert(siteSettings)
    .values({
      id: DEFAULT_ID,
      eventsCount,
      ...(communautePassword !== undefined ? { communautePassword } : {}),
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        eventsCount,
        ...(communautePassword !== undefined ? { communautePassword } : {}),
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return NextResponse.json(row);
}
