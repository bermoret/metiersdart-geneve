import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { parseSettingsInput } from "@/lib/settings-input";

const DEFAULT_ID = "default";

// Lecture : le tableau de bord (admin/page.tsx) lit la ligne côté serveur.

// PUT /api/admin/settings — met à jour les paramètres du site
export async function PUT(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Mise à jour partielle : seuls les champs envoyés sont modifiés (enregistrer
  // le mot de passe Communauté remettait le nombre de projets à 0).
  const parsed = parseSettingsInput(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { patch } = parsed;

  // Ligne absente : les champs non envoyés prennent leur DEFAULT (events_count = 0).
  const [row] = await db
    .insert(siteSettings)
    .values({ id: DEFAULT_ID, ...patch })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { ...patch, updatedAt: sql`now()` },
    })
    .returning();

  return NextResponse.json(row);
}
