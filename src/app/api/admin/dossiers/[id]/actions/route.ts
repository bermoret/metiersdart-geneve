import { NextResponse } from "next/server";
import { requireAdminApi, sessionAuthor } from "@/lib/admin";
import { isUuid } from "@/lib/dossier-fields";
import { isDossierAction } from "@/lib/dossier-rules";
import { runDossierAction } from "@/lib/dossiers-db";

// POST /api/admin/dossiers/[id]/actions — { action: eligible | activate | deactivate,
// motif?, occurredAt?, text? } : transition de statut + fiche + journal.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !isDossierAction(body.action)) {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }
  const result = await runDossierAction(id, {
    action: body.action,
    author: sessionAuthor(session),
    motif: body.motif,
    occurredAt: body.occurredAt,
    text: body.text,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ dossier: result.dossier, journal: result.journal });
}
