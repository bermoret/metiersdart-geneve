import { NextResponse } from "next/server";
import { db } from "@/db";
import { actualites } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { parseActuInput } from "@/lib/actu-medias-input";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const all = await db.select().from(actualites).orderBy(desc(actualites.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Validation (liens en http(s) / mailto / page du site, longueurs, dates) : src/lib/actu-medias-input.ts
  const parsed = parseActuInput(await req.json().catch(() => null), "create");
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const [created] = await db
      .insert(actualites)
      .values({ ...parsed.values, title: parsed.values.title! })
      .returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("POST actualites:", e);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
