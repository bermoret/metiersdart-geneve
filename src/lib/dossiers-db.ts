// Couche serveur des dossiers artisans (LOT A1) : lectures jointes, journal
// et actions de statut en transaction. ADMIN SEULEMENT : importé par les
// routes /api/admin et les pages /admin, jamais par le site public
// (src/lib/dossiers-exposure.test.ts le vérifie).

import { db } from "@/db";
import { artisanDocuments, artisanDossiers, artisanJournal, artisans, categories } from "@/db/schema";
import { and, asc, desc, eq, ilike, like, or, sql } from "drizzle-orm";
import { DEACTIVATION_REASONS, isIsoDate, type DossierStatus, type JournalType } from "./dossier-fields";
import { ACTION_TRANSITIONS, ficheFromDossier, nextStatus, todayZurich, uniqueSlug, type DossierAction } from "./dossier-rules";

export type DossierRow = typeof artisanDossiers.$inferSelect;
export type JournalRow = typeof artisanJournal.$inferSelect;
export type DocumentRow = typeof artisanDocuments.$inferSelect;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const listColumns = {
  id: artisanDossiers.id,
  status: artisanDossiers.status,
  firstName: artisanDossiers.firstName,
  lastName: artisanDossiers.lastName,
  workshopName: artisanDossiers.workshopName,
  craft: artisanDossiers.craft,
  commune: artisanDossiers.commune,
  integratedAt: artisanDossiers.integratedAt,
  deactivatedAt: artisanDossiers.deactivatedAt,
  updatedAt: artisanDossiers.updatedAt,
  artisanId: artisanDossiers.artisanId,
  categoryName: categories.name,
  artisanName: artisans.name,
  artisanSlug: artisans.slug,
  artisanPublished: artisans.published,
};

export type DossierListItem = {
  [K in keyof typeof listColumns]: (typeof listColumns)[K]["_"]["data"] | null;
};

/** Liste des dossiers, filtrée par statut et/ou recherche (nom, prénom, atelier, fiche). */
export async function listDossiers(filter: { status?: DossierStatus; q?: string } = {}): Promise<DossierListItem[]> {
  const conditions = [];
  if (filter.status) conditions.push(eq(artisanDossiers.status, filter.status));
  const q = filter.q?.trim();
  if (q) {
    // Motif ILIKE : les jokers saisis sont neutralisés, la recherche reste « contient ».
    const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    conditions.push(
      or(
        ilike(artisanDossiers.lastName, pattern),
        ilike(artisanDossiers.firstName, pattern),
        ilike(artisanDossiers.workshopName, pattern),
        ilike(artisans.name, pattern),
      ),
    );
  }
  const rows = await db
    .select(listColumns)
    .from(artisanDossiers)
    .leftJoin(artisans, eq(artisanDossiers.artisanId, artisans.id))
    .leftJoin(categories, eq(artisanDossiers.categoryId, categories.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(artisanDossiers.lastName), asc(artisanDossiers.workshopName), asc(artisans.name));
  return rows as DossierListItem[];
}

export type DossierDetail = {
  dossier: DossierRow;
  artisan: { id: string; name: string; slug: string; published: boolean | null; address: string | null } | null;
  documents: DocumentRow[];
  journal: JournalRow[];
};

/** Dossier complet : fiche liée (résumé), pièces, journal (plus récent en tête). */
export async function getDossier(id: string): Promise<DossierDetail | null> {
  const [dossier] = await db.select().from(artisanDossiers).where(eq(artisanDossiers.id, id)).limit(1);
  if (!dossier) return null;
  const [artisan, documents, journal] = await Promise.all([
    dossier.artisanId
      ? db
          .select({ id: artisans.id, name: artisans.name, slug: artisans.slug, published: artisans.published, address: artisans.address })
          .from(artisans)
          .where(eq(artisans.id, dossier.artisanId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : Promise.resolve(null),
    db.select().from(artisanDocuments).where(eq(artisanDocuments.dossierId, id)).orderBy(desc(artisanDocuments.uploadedAt)),
    db
      .select()
      .from(artisanJournal)
      .where(eq(artisanJournal.dossierId, id))
      .orderBy(desc(artisanJournal.occurredAt), desc(artisanJournal.createdAt)),
  ]);
  return { dossier, artisan, documents, journal };
}

export type JournalInput = {
  type: JournalType;
  occurredAt: string;
  text: string | null;
  motif?: string | null;
  author: string;
};

export async function insertJournal(tx: Tx | typeof db, dossierId: string, entry: JournalInput): Promise<JournalRow> {
  const [row] = await tx
    .insert(artisanJournal)
    .values({ dossierId, type: entry.type, occurredAt: entry.occurredAt, text: entry.text, motif: entry.motif ?? null, author: entry.author })
    .returning();
  return row;
}

/**
 * Changement d'adresse d'une fiche depuis l'admin : si un dossier est lié,
 * entrée « changement_adresse » datée du jour. Sans dossier, rien.
 */
export async function journalAddressChange(artisanId: string, text: string, author: string): Promise<void> {
  const [d] = await db.select({ id: artisanDossiers.id }).from(artisanDossiers).where(eq(artisanDossiers.artisanId, artisanId)).limit(1);
  if (!d) return;
  await insertJournal(db, d.id, { type: "changement_adresse", occurredAt: todayZurich(), text, author });
}

export type ActionInput = {
  action: DossierAction;
  author: string;
  /** Motif de désactivation (obligatoire pour `deactivate`). */
  motif?: unknown;
  /** Date de l'événement, « YYYY-MM-DD » (défaut : aujourd'hui). */
  occurredAt?: unknown;
  /** Note libre ajoutée au journal. */
  text?: unknown;
};

export type ActionResult = { ok: true; dossier: DossierRow; journal: JournalRow } | { ok: false; status: 400 | 404 | 409; error: string };

/**
 * Action de statut en transaction (dossier verrouillé) :
 * - eligible : crée la fiche publique non publiée depuis le dossier (sauf si
 *   une fiche est déjà liée) ;
 * - activate : publie la fiche, pose la date d'intégration si vide ;
 * - deactivate : dépublie la fiche (jamais supprimée), note motif et date.
 * Chaque action écrit une entrée de journal avec l'auteur.
 */
export async function runDossierAction(id: string, input: ActionInput): Promise<ActionResult> {
  const occurredAt = input.occurredAt === undefined || input.occurredAt === null || input.occurredAt === "" ? todayZurich() : input.occurredAt;
  if (!isIsoDate(occurredAt)) return { ok: false, status: 400, error: "Date invalide (AAAA-MM-JJ attendu)" };
  const text = typeof input.text === "string" ? input.text.trim().slice(0, 5000) || null : null;
  const motif = typeof input.motif === "string" ? input.motif : null;
  if (input.action === "deactivate" && !DEACTIVATION_REASONS.some((r) => r.value === motif)) {
    return { ok: false, status: 400, error: "Motif de désactivation requis" };
  }

  return db.transaction(async (tx): Promise<ActionResult> => {
    const [dossier] = await tx.select().from(artisanDossiers).where(eq(artisanDossiers.id, id)).for("update").limit(1);
    if (!dossier) return { ok: false, status: 404, error: "Dossier introuvable" };
    const to = nextStatus(dossier.status, input.action);
    if (!to) return { ok: false, status: 409, error: `Action impossible depuis le statut « ${dossier.status} »` };

    const patch: Partial<DossierRow> = { status: to, updatedAt: new Date() };
    let journalText = text;

    if (input.action === "eligible") {
      if (!dossier.artisanId) {
        const fiche = ficheFromDossier(dossier);
        if ("error" in fiche) return { ok: false, status: 400, error: fiche.error };
        const base = uniqueSlug(fiche.name, new Set());
        const taken = await tx.select({ slug: artisans.slug }).from(artisans).where(like(artisans.slug, `${base}%`));
        const slug = uniqueSlug(fiche.name, new Set(taken.map((t) => t.slug)));
        const [created] = await tx.insert(artisans).values({ ...fiche, slug }).returning({ id: artisans.id, name: artisans.name });
        patch.artisanId = created.id;
        journalText = journalText ?? `Déclaré·e éligible — fiche « ${created.name} » créée (non publiée)`;
      } else {
        journalText = journalText ?? "Déclaré·e éligible";
      }
    } else if (input.action === "activate") {
      if (!dossier.artisanId) return { ok: false, status: 409, error: "Créez d'abord la fiche publique (bouton « Éligible »)" };
      await tx.update(artisans).set({ published: true, updatedAt: new Date() }).where(eq(artisans.id, dossier.artisanId));
      patch.integratedAt = dossier.integratedAt ?? occurredAt;
      patch.deactivatedAt = null;
      patch.deactivationReason = null;
      journalText = journalText ?? (dossier.status === "desactive" ? "Réactivé·e — fiche republiée" : "Activé·e — fiche publiée");
    } else {
      if (dossier.artisanId) {
        await tx.update(artisans).set({ published: false, updatedAt: new Date() }).where(eq(artisans.id, dossier.artisanId));
      }
      patch.deactivatedAt = occurredAt;
      patch.deactivationReason = motif;
      const label = DEACTIVATION_REASONS.find((r) => r.value === motif)?.label ?? motif;
      journalText = journalText ?? `Désactivé·e — ${label}${dossier.artisanId ? " (fiche dépubliée)" : ""}`;
    }

    const [updated] = await tx.update(artisanDossiers).set(patch).where(eq(artisanDossiers.id, id)).returning();
    const journal = await insertJournal(tx, id, {
      type: ACTION_TRANSITIONS[input.action].journal,
      occurredAt,
      text: journalText,
      motif: input.action === "deactivate" ? motif : null,
      author: input.author,
    });
    return { ok: true, dossier: updated, journal };
  });
}

/** Nombre de dossiers par statut (tableau de bord admin). */
export async function countDossiersByStatus(): Promise<Record<DossierStatus, number>> {
  const rows = await db
    .select({ status: artisanDossiers.status, n: sql<number>`count(*)::int` })
    .from(artisanDossiers)
    .groupBy(artisanDossiers.status);
  const out: Record<DossierStatus, number> = { en_evaluation: 0, eligible: 0, actif: 0, desactive: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}
