import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/communaute/verify — vérifie le mot de passe commun
export async function POST(req: Request) {
  const body = await req.json();
  const password = body.password as string | undefined;

  if (!password || !password.trim()) {
    return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
  }

  const [settings] = await db
    .select({ communautePassword: siteSettings.communautePassword })
    .from(siteSettings)
    .where(eq(siteSettings.id, "default"))
    .limit(1);

  const expected = settings?.communautePassword;

  // Si aucun mot de passe n'est configuré, on refuse l'accès
  if (!expected) {
    return NextResponse.json({ error: "Accès non configuré" }, { status: 403 });
  }

  if (password.trim() === expected) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
}
