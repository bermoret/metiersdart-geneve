import { NextResponse } from "next/server";
import { db } from "@/db";
import { artisanDossiers, artisanJournal } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdminApi, sessionAuthor } from "@/lib/admin";
import { MANUAL_JOURNAL_TYPES, isIsoDate, isUuid, type JournalType } from "@/lib/dossier-fields";
import { todayZurich } from "@/lib/dossier-rules";
import { insertJournal } from "@/lib/dossiers-db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/admin/dossiers/[id]/journal — entrées, plus récente en tête
export async function GET(_req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const rows = await db
    .select()
    .from(artisanJournal)
    .where(eq(artisanJournal.dossierId, id))
    .orderBy(desc(artisanJournal.occurredAt), desc(artisanJournal.createdAt));
  return NextResponse.json(rows);
}

// POST /api/admin/dossiers/[id]/journal — entrée manuelle (remarque,
// changement d'adresse, fermeture). Activation / désactivation / éligibilité
// ne s'écrivent que par /actions. Le journal est en ajout seul.
export async function POST(req: Request, { params }: Ctx) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps JSON attendu" }, { status: 400 });
  const type = body.type;
  if (!MANUAL_JOURNAL_TYPES.includes(type as JournalType)) {
    return NextResponse.json({ error: "Type d'entrée non admis" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 5000) : "";
  if (!text) return NextResponse.json({ error: "Le texte est requis" }, { status: 400 });
  const occurredAt = body.occurredAt === undefined || body.occurredAt === null || body.occurredAt === "" ? todayZurich() : body.occurredAt;
  if (!isIsoDate(occurredAt)) return NextResponse.json({ error: "Date invalide (AAAA-MM-JJ attendu)" }, { status: 400 });
  const motif = typeof body.motif === "string" ? body.motif.trim().slice(0, 100) || null : null;

  const [d] = await db.select({ id: artisanDossiers.id }).from(artisanDossiers).where(eq(artisanDossiers.id, id)).limit(1);
  if (!d) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const row = await insertJournal(db, id, { type: type as JournalType, occurredAt, text, motif, author: sessionAuthor(session) });
  return NextResponse.json(row, { status: 201 });
}
