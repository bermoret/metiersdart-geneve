import { NextResponse } from "next/server";
import { db } from "@/db";
import { medias } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { parseMediaInput } from "@/lib/actu-medias-input";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Par section puis dans l'ordre de la page (ordre de tri, date décroissante), comme /medias
  const all = await db
    .select()
    .from(medias)
    .orderBy(asc(medias.type), asc(medias.sortOrder), desc(medias.date), asc(medias.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Validation (type, adresse http(s) exigée par le type, vidéo reconnue) : src/lib/actu-medias-input.ts
  const parsed = parseMediaInput(await req.json().catch(() => null), "create");
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const [created] = await db
      .insert(medias)
      .values({ ...parsed.values, title: parsed.values.title!, type: parsed.values.type! })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST medias:", e);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
