import { NextResponse } from "next/server";
import { db } from "@/db";
import { medias } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const all = await db.select().from(medias).orderBy(desc(medias.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const [created] = await db
    .insert(medias)
    .values({
      title: body.title,
      type: body.type || "video",
      mediaType: body.mediaType,
      categoryId: body.categoryId,
      videoUrl: body.videoUrl,
      externalUrl: body.externalUrl,
      pdfUrl: body.pdfUrl,
      date: body.date ? new Date(body.date) : null,
      source: body.source,
      description: body.description,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
