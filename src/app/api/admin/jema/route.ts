import { NextResponse } from "next/server";
import { db } from "@/db";
import { jemaEditions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

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
  const [created] = await db
    .insert(jemaEditions)
    .values({
      year: body.year,
      title: body.title || `JEMA ${body.year}`,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      isUpcoming: body.isUpcoming ?? false,
      isPast: body.isPast ?? true,
      description: body.description,
      programUrl: body.programUrl,
      stats: body.stats,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
