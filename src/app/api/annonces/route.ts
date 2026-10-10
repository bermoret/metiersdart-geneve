import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { annonces } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Resend } from "resend";
import { communauteAccess, noStore, submitLimiter } from "@/lib/communaute-access";
import { clientIp } from "@/lib/communaute-token";
import { escapeHtml } from "@/lib/html";
import { parseAnnonceInput } from "@/lib/annonces";
import { checkAnnoncePhoto, discardAnnoncePhoto, putAnnoncePhoto } from "@/lib/annonces-photo";

const reply = (body: unknown, status = 200) => noStore(NextResponse.json(body, { status }));

const refused = (access: "denied" | "unavailable") =>
  access === "unavailable"
    ? reply({ error: "Service momentanément indisponible" }, 503)
    : reply({ error: "Accès réservé aux membres" }, 401);

// GET /api/annonces — liste les annonces publiées (membres), plus récente d'abord
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
        imageUrl: annonces.imageUrl,
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

/**
 * Corps de la soumission : JSON (sans photo) ou multipart/form-data (champs
 * texte + fichier « photo » facultatif). Le navigateur réduit la photo avant
 * l'envoi (src/lib/image-resize.ts) ; le serveur vérifie les octets et la taille.
 */
async function readSubmission(req: NextRequest): Promise<{ fields: Record<string, unknown>; photo: File | null } | null> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    if (!fd) return null;
    const fields: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) if (typeof v === "string") fields[k] = v;
    const photo = fd.get("photo");
    return { fields, photo: photo instanceof File && photo.size > 0 ? photo : null };
  }
  const body = await req.json().catch(() => null);
  return body && typeof body === "object" ? { fields: body as Record<string, unknown>, photo: null } : null;
}

// POST /api/annonces — soumet une nouvelle annonce (membres), photo facultative
export async function POST(req: NextRequest) {
  const access = await communauteAccess(req);
  if (access !== "ok") return refused(access);

  const submission = await readSubmission(req);
  if (!submission) return reply({ error: "Requête invalide" }, 400);
  const parsed = parseAnnonceInput(submission.fields);
  if (!parsed.ok) return reply({ error: parsed.error }, 400);
  const { title, category, authorName, authorEmail, content } = parsed.value;

  // Photo contrôlée (taille, octets) avant de compter la soumission
  let photo: Awaited<ReturnType<typeof checkAnnoncePhoto>> | null = null;
  if (submission.photo) {
    photo = await checkAnnoncePhoto(submission.photo);
    if ("error" in photo) return reply({ error: photo.error }, 400);
  }

  // Compté seulement pour une soumission valide, juste avant l'écriture
  if (!submitLimiter.hit(clientIp(req.headers)).ok) {
    return reply({ error: "Trop d'annonces soumises, réessayez plus tard" }, 429);
  }

  let imageUrl: string | null = null;
  if (photo && !("error" in photo)) {
    try {
      imageUrl = await putAnnoncePhoto(photo);
    } catch (err) {
      console.error("[annonces] dépôt de la photo impossible :", err);
      return refused("unavailable");
    }
  }

  let annonce: typeof annonces.$inferSelect;
  try {
    [annonce] = await db
      .insert(annonces)
      .values({ title, category, authorName, authorEmail, content, imageUrl, status: "pending" })
      .returning();
  } catch (err) {
    console.error("[annonces] enregistrement impossible :", err);
    await discardAnnoncePhoto(imageUrl);
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
        ${imageUrl ? `<p><strong>Photo :</strong> <a href="${escapeHtml(imageUrl)}">voir la photo</a></p>` : ""}
        <p><strong>Contenu :</strong></p>
        <pre>${escapeHtml(content)}</pre>
        <p style="margin-top:20px;color:#888;font-size:13px">
          Connectez-vous à l'administration MAG pour valider, modifier ou refuser cette annonce.
        </p>
      `,
    });
  } catch {
    // Non bloquant : l'annonce est créée même si le mail échoue
  }

  return reply(annonce, 201);
}
