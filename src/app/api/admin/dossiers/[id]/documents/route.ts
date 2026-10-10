import { NextResponse } from "next/server";
import { del, head } from "@vercel/blob";
import { db } from "@/db";
import { artisanDocuments, artisanDossiers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdminApi, sessionAuthor } from "@/lib/admin";
import { isUuid } from "@/lib/dossier-fields";
import {
  DOCUMENT_CONTENT_TYPES,
  DOCUMENT_MAX_BYTES,
  isAllowedContentType,
  isDocumentKind,
  parseDocumentPathname,
} from "@/lib/dossier-documents";
import { isPgError } from "@/lib/pg-errors";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/dossiers/[id]/documents — pièces du dossier
export async function GET(_req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const rows = await db.select().from(artisanDocuments).where(eq(artisanDocuments.dossierId, id)).orderBy(desc(artisanDocuments.uploadedAt));
  return NextResponse.json(rows);
}

/**
 * Le blob est-il lisible sans jeton ? (il ne doit PAS l'être). Les redirections
 * sont suivies : seul le statut final compte, un 2xx = lisible publiquement.
 */
async function isPubliclyReadable(url: string): Promise<boolean> {
  const res = await fetch(url, { method: "HEAD", redirect: "follow", cache: "no-store" });
  return res.status >= 200 && res.status < 300;
}

// POST /api/admin/dossiers/[id]/documents — enregistre une pièce envoyée
// directement dans Blob : { pathname, label?, kind? }. Métadonnées relues
// depuis Blob (pas depuis le navigateur) ; une pièce lisible publiquement ou
// d'un type inattendu est effacée et refusée.
export async function POST(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = parseDocumentPathname(body?.pathname);
  if (!parsed || parsed.dossierId !== id.toLowerCase()) {
    return NextResponse.json({ error: "Chemin de pièce invalide" }, { status: 400 });
  }
  const pathname = body!.pathname as string;
  const kind = isDocumentKind(body?.kind) ? body!.kind : "autre";
  const label = (typeof body?.label === "string" ? body.label.trim().slice(0, 255) : "") || pathname.split("/").pop()!;

  const [d] = await db.select({ id: artisanDossiers.id }).from(artisanDossiers).where(eq(artisanDossiers.id, id)).limit(1);
  if (!d) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let meta: Awaited<ReturnType<typeof head>>;
  try {
    meta = await head(pathname);
  } catch (e) {
    console.error("POST dossiers/documents head:", e);
    return NextResponse.json({ error: "Pièce introuvable dans le stockage" }, { status: 400 });
  }
  const reject = async (error: string) => {
    await del(pathname).catch((e) => console.error("del après refus:", e));
    return NextResponse.json({ error }, { status: 400 });
  };
  if (!isAllowedContentType(meta.contentType) || DOCUMENT_CONTENT_TYPES[meta.contentType] !== parsed.ext) {
    return reject("Type de fichier non admis");
  }
  if (meta.size > DOCUMENT_MAX_BYTES) return reject("Pièce trop volumineuse (10 Mo maximum)");
  let publicRead: boolean;
  try {
    publicRead = await isPubliclyReadable(meta.url);
  } catch (e) {
    console.error("POST dossiers/documents vérification privée:", e);
    await del(pathname).catch(() => {});
    return NextResponse.json({ error: "Vérification du stockage privé impossible, pièce retirée : réessayez." }, { status: 502 });
  }
  if (publicRead) return reject("La pièce a été stockée en accès public : retirée. Réessayez l'envoi.");

  try {
    const [row] = await db
      .insert(artisanDocuments)
      .values({ dossierId: id, label, kind, pathname, contentType: meta.contentType, size: meta.size, uploadedBy: sessionAuthor(session) })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (isPgError(e, "23505")) return NextResponse.json({ error: "Pièce déjà enregistrée" }, { status: 409 });
    throw e;
  }
}
