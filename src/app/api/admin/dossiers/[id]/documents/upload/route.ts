import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db } from "@/db";
import { artisanDossiers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin";
import { isUuid } from "@/lib/dossier-fields";
import { DOCUMENT_CONTENT_TYPES, DOCUMENT_MAX_BYTES, parseDocumentPathname } from "@/lib/dossier-documents";

// Jeton d'envoi DIRECT navigateur → Vercel Blob pour une pièce justificative
// (même mécanisme que /api/admin/upload/pdf : une fonction Vercel refuse les
// corps > 4,5 Mo). Le navigateur envoie avec `access: "private"` ; la route
// d'enregistrement (../route.ts, POST) vérifie ensuite que le blob n'est pas
// lisible publiquement avant de l'inscrire au dossier. Bornes posées ici,
// appliquées par Blob : chemin dossiers/<id>/*, types admis, 10 Mo, 10 min.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (body?.type !== "blob.generate-client-token") {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const parsed = parseDocumentPathname(body.payload?.pathname);
  if (!parsed || parsed.dossierId !== id.toLowerCase()) {
    return NextResponse.json({ error: "Nom de fichier non autorisé" }, { status: 400 });
  }
  const [d] = await db.select({ id: artisanDossiers.id }).from(artisanDossiers).where(eq(artisanDossiers.id, id)).limit(1);
  if (!d) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: Object.keys(DOCUMENT_CONTENT_TYPES),
        maximumSizeInBytes: DOCUMENT_MAX_BYTES,
        addRandomSuffix: true,
        validUntil: Date.now() + 10 * 60 * 1000,
      }),
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("POST dossiers/documents/upload:", e);
    return NextResponse.json({ error: "Envoi de la pièce impossible" }, { status: 500 });
  }
}
