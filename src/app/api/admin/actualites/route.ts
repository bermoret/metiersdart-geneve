import { NextResponse } from "next/server";
import { db } from "@/db";
import { actualites } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const all = await db.select().from(actualites).orderBy(desc(actualites.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const [created] = await db
    .insert(actualites)
    .values({
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      category: body.category,
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      eventEndDate: body.eventEndDate ? new Date(body.eventEndDate) : null,
      linkUrl: body.linkUrl,
      imageUrl: body.imageUrl,
      published: body.published ?? true,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
