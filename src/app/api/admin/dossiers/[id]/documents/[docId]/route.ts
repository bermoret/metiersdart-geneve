import { NextResponse } from "next/server";
import { del, get } from "@vercel/blob";
import { db } from "@/db";
import { artisanDocuments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { isUuid } from "@/lib/dossier-fields";
import { DOCUMENT_CONTENT_TYPES, contentDisposition, isAllowedContentType } from "@/lib/dossier-documents";

type Ctx = { params: Promise<{ id: string; docId: string }> };

async function loadDoc(id: string, docId: string) {
  if (!isUuid(id) || !isUuid(docId)) return null;
  const [row] = await db
    .select()
    .from(artisanDocuments)
    .where(and(eq(artisanDocuments.id, docId), eq(artisanDocuments.dossierId, id)))
    .limit(1);
  return row ?? null;
}

// GET /api/admin/dossiers/[id]/documents/[docId][?download=1] — la pièce,
// relue dans le blob PRIVÉ et transmise en flux (seule voie d'accès).
export async function GET(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, docId } = await params;
  const doc = await loadDoc(id, docId);
  if (!doc || !isAllowedContentType(doc.contentType)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const blob = await get(doc.pathname, { access: "private", useCache: false }).catch((e) => {
    console.error("GET dossiers/documents blob:", e);
    return null;
  });
  if (!blob || blob.statusCode !== 200) return NextResponse.json({ error: "Pièce indisponible" }, { status: 404 });

  const download = new URL(req.url).searchParams.get("download") === "1";
  return new Response(blob.stream, {
    status: 200,
    headers: {
      "Content-Type": doc.contentType,
      "Content-Length": String(blob.blob.size),
      "Content-Disposition": contentDisposition(doc.label, DOCUMENT_CONTENT_TYPES[doc.contentType], !download),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      // Types bornés (PDF, images) + nosniff ; aucune ressource ne peut être chargée depuis cette réponse.
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}

// DELETE /api/admin/dossiers/[id]/documents/[docId] — blob d'abord, puis la
// ligne : si Blob refuse, la pièce reste listée (rien n'est perdu).
export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, docId } = await params;
  const doc = await loadDoc(id, docId);
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  try {
    await del(doc.pathname);
  } catch (e) {
    console.error("DELETE dossiers/documents blob:", e);
    return NextResponse.json({ error: "Suppression impossible dans le stockage, réessayez." }, { status: 502 });
  }
  await db.delete(artisanDocuments).where(eq(artisanDocuments.id, doc.id));
  return NextResponse.json({ ok: true });
}
