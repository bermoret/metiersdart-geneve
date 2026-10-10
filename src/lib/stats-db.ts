// Statistiques et export Excel (LOT A2) : requêtes serveur, ADMIN SEULEMENT
// (tables internes artisan_dossiers / artisan_journal). Les calculs sont dans
// src/lib/stats.ts et src/lib/excel-export-rules.ts (purs, testés).

import { db } from "@/db";
import { artisanDossiers, artisanJournal, artisans, categories, communes, siteSettings } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { todayZurich } from "./dossier-rules";
import { EXCLUDED_CATEGORY_SLUGS } from "./data";
import type { ExportData, ExportArtisanRow } from "./excel-export";
import { countBy, evolutionByYear, exitsByYearAndReason, yearRange, type CommuneView, type DossierDates, type YearPoint } from "./stats";
export type { CommuneView } from "./stats";
import { distinctCrafts, excelDomaineLabel } from "./excel-export-rules";
import { normalizeName } from "./mag-excel";

const ARTISAN_TYPES = ["artisan", "atelier", "entreprise"] as const;

type DossierWithFiche = {
  dossier: typeof artisanDossiers.$inferSelect;
  fiche: { id: string; name: string; craft: string | null; categoryName: string | null; commune: string | null; poinconType: string | null; published: boolean | null } | null;
};

async function loadDossiers(): Promise<DossierWithFiche[]> {
  const rows = await db
    .select({
      dossier: artisanDossiers,
      ficheId: artisans.id,
      ficheName: artisans.name,
      ficheCraft: artisans.craft,
      ficheCommune: artisans.commune,
      fichePoincon: artisans.poinconType,
      fichePublished: artisans.published,
      ficheCategory: categories.name,
    })
    .from(artisanDossiers)
    .leftJoin(artisans, eq(artisanDossiers.artisanId, artisans.id))
    .leftJoin(categories, eq(artisans.categoryId, categories.id));
  // Domaine du dossier (avant fiche) : résolu à part, la jointure ci-dessus porte sur la fiche.
  const catIds = [...new Set(rows.map((r) => r.dossier.categoryId).filter((c): c is string => !!c))];
  const cats = catIds.length ? await db.select({ id: categories.id, name: categories.name }).from(categories).where(inArray(categories.id, catIds)) : [];
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  return rows.map((r) => ({
    dossier: r.dossier,
    fiche: r.ficheId
      ? { id: r.ficheId, name: r.ficheName!, craft: r.ficheCraft, categoryName: r.ficheCategory ?? (r.dossier.categoryId ? catName.get(r.dossier.categoryId) ?? null : null), commune: r.ficheCommune, poinconType: r.fichePoincon, published: r.fichePublished }
      : null,
  }));
}

/** Données de l'export Stat_GLOBALES (dossiers actifs et sortis, domaines, communes, fiches publiées). */
export async function loadExportData(): Promise<ExportData> {
  const [dossiers, cats, coms, published] = await Promise.all([
    loadDossiers(),
    db.select({ name: categories.name, slug: categories.slug }).from(categories).orderBy(asc(categories.sortOrder)),
    db.select({ name: communes.name, soutientMag: communes.soutientMag }).from(communes).orderBy(asc(communes.name)),
    db.select({ name: artisans.name, type: artisans.type, commune: artisans.commune }).from(artisans).where(eq(artisans.published, true)),
  ]);
  const ids = dossiers.filter((d) => d.dossier.status === "actif" || d.dossier.status === "desactive").map((d) => d.dossier.id);
  const journal = ids.length
    ? await db
        .select({ dossierId: artisanJournal.dossierId, occurredAt: artisanJournal.occurredAt, text: artisanJournal.text, type: artisanJournal.type })
        .from(artisanJournal)
        .where(inArray(artisanJournal.dossierId, ids))
    : [];
  const comments = new Map<string, ExportArtisanRow["comments"]>();
  for (const j of journal) {
    const list = comments.get(j.dossierId) ?? [];
    list.push({ occurredAt: j.occurredAt, text: j.text, type: j.type });
    comments.set(j.dossierId, list);
  }
  const rows: ExportArtisanRow[] = dossiers
    .filter((d) => d.dossier.status === "actif" || d.dossier.status === "desactive")
    .map(({ dossier: d, fiche }) => ({
      status: d.status as "actif" | "desactive",
      integratedAt: d.integratedAt,
      deactivatedAt: d.deactivatedAt,
      deactivationReason: d.deactivationReason,
      lastName: d.lastName,
      firstName: d.firstName,
      workshopName: d.workshopName,
      phone: d.phone,
      email: d.email,
      street: d.street,
      postalCode: d.postalCode,
      city: d.city,
      commune: fiche?.commune ?? d.commune,
      trainerCompany: d.trainerCompany,
      trainerCompanyNote: d.trainerCompanyNote,
      avsFund: d.avsFund,
      poinconType: fiche?.poinconType ?? d.poinconType,
      ficheName: fiche?.name ?? null,
      craft: fiche?.craft ?? d.craft,
      categoryName: fiche?.categoryName ?? null,
      comments: comments.get(d.id) ?? [],
    }));
  return {
    generatedAt: todayZurich(),
    artisans: rows,
    categories: cats.filter((c) => !EXCLUDED_CATEGORY_SLUGS.includes(c.slug)).map((c) => c.name),
    communes: coms.map((c) => ({ name: c.name, soutientMag: !!c.soutientMag })),
    entities: published.map((p) => ({ name: p.name, type: p.type ?? "artisan", commune: p.commune })),
  };
}

export type StatsOverview = {
  generatedAt: string;
  byStatus: Record<DossierDates["status"], number>;
  byDomaine: { key: string; count: number }[];
  byCommune: { key: string; count: number }[];
  evolution: YearPoint[];
  exits: { year: number | null; reason: string; count: number }[];
  /** Fiches artisan publiées (compteur public « artisans référencés »). */
  publishedArtisans: number;
  /** Dossiers actifs sans fiche publiée, ou fiches publiées sans dossier : écarts à regarder. */
  gaps: { activeWithoutPublishedFiche: string[]; publishedWithoutDossier: string[] };
  crafts: { manual: number | null; distinctFromFiches: number; sample: string[] };
};

export async function getStatsOverview(): Promise<StatsOverview> {
  const [dossiers, published, [settings]] = await Promise.all([
    loadDossiers(),
    db
      .select({ id: artisans.id, name: artisans.name, craft: artisans.craft, type: artisans.type })
      .from(artisans)
      .where(eq(artisans.published, true)),
    db.select({ craftsCount: siteSettings.craftsCount }).from(siteSettings).where(eq(siteSettings.id, "default")).limit(1),
  ]);
  const dates: DossierDates[] = dossiers.map((d) => ({
    status: d.dossier.status,
    integratedAt: d.dossier.integratedAt,
    deactivatedAt: d.dossier.deactivatedAt,
    deactivationReason: d.dossier.deactivationReason,
  }));
  const byStatus: Record<DossierDates["status"], number> = { en_evaluation: 0, eligible: 0, actif: 0, desactive: 0 };
  for (const d of dates) byStatus[d.status]++;
  const actifs = dossiers.filter((d) => d.dossier.status === "actif");
  const currentYear = Number(todayZurich().slice(0, 4));
  const years = yearRange(dates, currentYear);
  const publishedArtisanRows = published.filter((p) => (ARTISAN_TYPES as readonly string[]).includes(p.type ?? "artisan"));
  const withDossier = new Set(dossiers.map((d) => d.fiche?.id).filter(Boolean));
  const crafts = distinctCrafts(publishedArtisanRows.map((p) => p.craft));
  return {
    generatedAt: todayZurich(),
    byStatus,
    byDomaine: countBy(actifs, (d) => excelDomaineLabel(d.fiche?.categoryName) ?? null),
    byCommune: countBy(actifs, (d) => d.fiche?.commune ?? d.dossier.commune),
    evolution: evolutionByYear(dates, years),
    exits: exitsByYearAndReason(dates),
    publishedArtisans: publishedArtisanRows.length,
    gaps: {
      activeWithoutPublishedFiche: actifs.filter((d) => !d.fiche?.published).map((d) => d.fiche?.name ?? ([d.dossier.firstName, d.dossier.lastName].filter(Boolean).join(" ") || "(sans nom)")),
      publishedWithoutDossier: publishedArtisanRows.filter((p) => !withDossier.has(p.id)).map((p) => p.name),
    },
    crafts: { manual: settings?.craftsCount ?? null, distinctFromFiches: crafts.length, sample: crafts.slice(0, 12) },
  };
}


/** Fiches publiées d'une commune, par type, avec le statut du dossier pour les artisans. */
export async function getCommuneView(commune: string): Promise<CommuneView> {
  const rows = await db
    .select({
      name: artisans.name, slug: artisans.slug, type: artisans.type, craft: artisans.craft, commune: artisans.commune,
      categoryName: categories.name, status: artisanDossiers.status, integratedAt: artisanDossiers.integratedAt,
    })
    .from(artisans)
    .leftJoin(categories, eq(artisans.categoryId, categories.id))
    .leftJoin(artisanDossiers, eq(artisanDossiers.artisanId, artisans.id))
    .where(eq(artisans.published, true))
    .orderBy(asc(artisans.name));
  const inCommune = rows.filter((r) => r.commune && normalizeName(r.commune) === normalizeName(commune));
  const of = (type: string) => inCommune.filter((r) => (r.type ?? "artisan") === type).map((r) => ({ name: r.name, slug: r.slug }));
  return {
    commune,
    artisans: inCommune
      .filter((r) => (ARTISAN_TYPES as readonly string[]).includes(r.type ?? "artisan"))
      .map((r) => ({ name: r.name, craft: r.craft, categoryName: r.categoryName, slug: r.slug, status: r.status, integratedAt: r.integratedAt })),
    ecoles: of("ecole_formatrice"),
    institutions: of("institution_culturelle"),
    associations: of("association_professionnelle"),
    partenaires: of("partenaire"),
  };
}

/** Métiers distincts des fiches artisan publiées (indicatif, à côté du chiffre saisi). */
export async function getDistinctCraftsCount(): Promise<number> {
  const rows = await db
    .select({ craft: artisans.craft, type: artisans.type })
    .from(artisans)
    .where(eq(artisans.published, true));
  return distinctCrafts(rows.filter((r) => (ARTISAN_TYPES as readonly string[]).includes(r.type ?? "artisan")).map((r) => r.craft)).length;
}
