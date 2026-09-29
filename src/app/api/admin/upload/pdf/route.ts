import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdminApi } from "@/lib/admin";
import { PDF_MAX_BYTES, isPdfPathname } from "@/lib/pdf-upload";

// Jeton d'envoi DIRECT navigateur → Vercel Blob pour les PDF (revues de presse,
// articles archivés) : une fonction Vercel refuse les corps de plus de 4,5 Mo,
// or les revues de presse JEMA font 4 à 36 Mo. Le fichier ne transite donc pas
// par ce serveur : le contrôle des octets « %PDF- » se fait dans le navigateur
// (src/lib/pdf-upload.ts) ; ici, admin seulement, chemin presse/*.pdf, type
// application/pdf et taille bornés par le jeton (appliqués par Blob).
// Pas de onUploadCompleted : aucun rappel de Blob à recevoir sur cette route.
export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (body?.type !== "blob.generate-client-token") {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!isPdfPathname(body.payload?.pathname)) {
    return NextResponse.json({ error: "Nom de fichier non autorisé" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf"],
        maximumSizeInBytes: PDF_MAX_BYTES,
        addRandomSuffix: true,
        validUntil: Date.now() + 10 * 60 * 1000,
      }),
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("POST upload/pdf:", e);
    return NextResponse.json({ error: "Envoi du PDF impossible" }, { status: 500 });
  }
}
