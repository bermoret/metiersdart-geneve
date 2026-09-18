import { NextResponse } from "next/server";
import { db } from "@/db";
import { annonces, siteSettings } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Resend } from "resend";

// GET /api/annonces — liste les annonces publiées (public)
export async function GET() {
  const rows = await db
    .select({
      id: annonces.id,
      title: annonces.title,
      category: annonces.category,
      authorName: annonces.authorName,
      content: annonces.content,
      publishedAt: annonces.publishedAt,
    })
    .from(annonces)
    .where(eq(annonces.status, "published"))
    .orderBy(desc(annonces.publishedAt));

  return NextResponse.json(rows);
}

// POST /api/annonces — soumet une nouvelle annonce (public, pas d'auth)
export async function POST(req: Request) {
  const body = await req.json();

  if (!body.title?.trim() || !body.content?.trim() || !body.category?.trim() || !body.authorName?.trim()) {
    return NextResponse.json(
      { error: "Titre, catégorie, auteur et contenu sont requis" },
      { status: 400 },
    );
  }

  const [annonce] = await db
    .insert(annonces)
    .values({
      title: body.title.trim().slice(0, 500),
      category: body.category.trim(),
      authorName: body.authorName.trim().slice(0, 255),
      authorEmail: body.authorEmail?.trim() || null,
      content: body.content.trim(),
      status: "pending",
    })
    .returning();

  // Notification par mail à MAG
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "contact@jooce.ch",
      to: "contact@metiersdart-geneve.ch",
      subject: `[MAG Communauté] Nouvelle annonce à modérer : ${body.title}`,
      html: `
        <h2>Nouvelle annonce soumise</h2>
        <p><strong>Titre :</strong> ${body.title}</p>
        <p><strong>Catégorie :</strong> ${body.category}</p>
        <p><strong>Auteur :</strong> ${body.authorName}</p>
        ${body.authorEmail ? `<p><strong>Email :</strong> ${body.authorEmail}</p>` : ""}
        <p><strong>Contenu :</strong></p>
        <pre>${body.content}</pre>
        <p style="margin-top:20px;color:#888;font-size:13px">
          Connectez-vous à l'administration MAG pour valider ou refuser cette annonce.
        </p>
      `,
    });
  } catch {
    // Non bloquant : l'annonce est créée même si le mail échoue
  }

  return NextResponse.json(annonce, { status: 201 });
}
