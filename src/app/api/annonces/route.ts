import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { annonces } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Resend } from "resend";
import { communauteAccess, noStore, submitLimiter } from "@/lib/communaute-access";
import { clientIp } from "@/lib/communaute-token";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const reply = (body: unknown, status = 200) => noStore(NextResponse.json(body, { status }));

const refused = (access: "denied" | "unavailable") =>
  access === "unavailable"
    ? reply({ error: "Service momentanément indisponible" }, 503)
    : reply({ error: "Accès réservé aux membres" }, 401);

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// GET /api/annonces — liste les annonces publiées (membres)
export async function GET(req: NextRequest) {
  const access = await communauteAccess(req);
  if (access !== "ok") return refused(access);

  try {
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
    return reply(rows);
  } catch (err) {
    console.error("[annonces] lecture impossible :", err);
    return refused("unavailable");
  }
}

// POST /api/annonces — soumet une nouvelle annonce (membres)
export async function POST(req: NextRequest) {
  const access = await communauteAccess(req);
  if (access !== "ok") return refused(access);

  const body = await req.json().catch(() => null);
  const title = str(body?.title).slice(0, 500);
  const category = str(body?.category).slice(0, 100);
  const authorName = str(body?.authorName).slice(0, 255);
  const authorEmail = str(body?.authorEmail).slice(0, 255) || null;
  const content = str(body?.content);

  if (!title || !content || !category || !authorName) {
    return reply({ error: "Titre, catégorie, auteur et contenu sont requis" }, 400);
  }
  if (content.length > 10_000) {
    return reply({ error: "Contenu trop long (10 000 caractères maximum)" }, 400);
  }

  // Compté seulement pour une soumission valide, juste avant l'écriture
  if (!submitLimiter.hit(clientIp(req.headers)).ok) {
    return reply({ error: "Trop d'annonces soumises, réessayez plus tard" }, 429);
  }

  let annonce: typeof annonces.$inferSelect;
  try {
    [annonce] = await db
      .insert(annonces)
      .values({ title, category, authorName, authorEmail, content, status: "pending" })
      .returning();
  } catch (err) {
    console.error("[annonces] enregistrement impossible :", err);
    return refused("unavailable");
  }

  // Notification par mail à MAG
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "contact@jooce.ch",
      to: "contact@metiersdart-geneve.ch",
      subject: `[MAG Communauté] Nouvelle annonce à modérer : ${title.replace(/\s+/g, " ").slice(0, 80)}`,
      html: `
        <h2>Nouvelle annonce soumise</h2>
        <p><strong>Titre :</strong> ${escapeHtml(title)}</p>
        <p><strong>Catégorie :</strong> ${escapeHtml(category)}</p>
        <p><strong>Auteur :</strong> ${escapeHtml(authorName)}</p>
        ${authorEmail ? `<p><strong>Email :</strong> ${escapeHtml(authorEmail)}</p>` : ""}
        <p><strong>Contenu :</strong></p>
        <pre>${escapeHtml(content)}</pre>
        <p style="margin-top:20px;color:#888;font-size:13px">
          Connectez-vous à l'administration MAG pour valider ou refuser cette annonce.
        </p>
      `,
    });
  } catch {
    // Non bloquant : l'annonce est créée même si le mail échoue
  }

  return reply(annonce, 201);
}
