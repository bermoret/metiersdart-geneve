import { NextResponse } from "next/server";
import { db } from "@/db";
import { jemaEditions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { isHttpUrl } from "@/lib/url";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const all = await db.select().from(jemaEditions).orderBy(desc(jemaEditions.year));
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  // highlight = varchar(255) : refus explicite plutôt qu'une erreur SQL
  if (typeof body.highlight === "string" && body.highlight.length > 255) {
    return NextResponse.json({ error: "Le temps fort ne doit pas dépasser 255 caractères." }, { status: 400 });
  }
  // Lien public du programme : http(s) seulement (pas de « javascript: » dans un href).
  const programUrl = typeof body.programUrl === "string" ? body.programUrl.trim() : body.programUrl;
  if (programUrl && !isHttpUrl(programUrl)) {
    return NextResponse.json({ error: "L'URL du programme doit commencer par http:// ou https://." }, { status: 400 });
  }
  const [created] = await db
    .insert(jemaEditions)
    .values({
      year: body.year,
      title: body.title || `JEMA ${body.year}`,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      isUpcoming: body.isUpcoming ?? false,
      isPast: body.isPast ?? true,
      description: body.description ? String(body.description) : null,
      highlight: body.highlight ? String(body.highlight) : null,
      programUrl: programUrl || null,
      stats: body.stats,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
