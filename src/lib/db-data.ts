// Couche d'accès aux données pour les pages publiques.
//
// PRINCIPE : le site public lit la base de données (source de vérité,
// alimentée par l'admin), avec un FALLBACK sur les données statiques de
// src/lib/data.ts UNIQUEMENT si la base n'est pas configurée (build ou
// tests sans DATABASE_URL). Base configurée = source de vérité, même si une
// table est vide. Base configurée mais en erreur → on logue et
// on relance : en ISR, Next continue de servir la dernière page valide
// au lieu de mettre en cache des données statiques périmées (artisans
// dépubliés qui réapparaissent, modifications admin perdues).
//
// PERF : les fonctions sont enveloppées dans React `cache()`, ce qui
// déduplique les requêtes au sein d'un même rendu (une seule requête
// même si plusieurs composants appellent la fonction). Next.js met en
// cache les pages statiques au build ; les pages dynamiques (revalidate)
// rafraîchissent les données.

import { cache } from "react";
import { db } from "@/db";
import { artisans, categories, communes, jemaEditions } from "@/db/schema";
import { and, eq, asc, desc } from "drizzle-orm";
import {
  artisans as staticArtisans,
  categories as allStaticCategories,
  communesList as staticCommunes,
  EXCLUDED_TYPES as NON_ARTISAN_TYPES,
  EXCLUDED_CATEGORY_SLUGS,
} from "./data";
import { getArtisanDetail } from "./artisan-details";
import { communeKey, sortByName } from "./utils";

// ─── Types publics ──────────────────────────────────────────────

export type PublicArtisan = {
  id: string;
  name: string;
  slug: string;
  type: string;
  craft: string | null;
  categoryId: string | null;
  categoryName: string | null;
  commune: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  imageUrl: string | null;
  video: string | null;
  autre: string | null;
  poinconType: string | null;
  poinconModalText: string | null;
  poinconModalLink: string | null;
  jemaParticipant: boolean | null;
};

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
};

export type PublicCommune = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  soutientMag: boolean | null;
};

export type PublicJemaEdition = {
  id: string;
  year: number;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  isUpcoming: boolean | null;
  isPast: boolean | null;
  description: string | null;
  highlight: string | null;
  programUrl: string | null;
  stats: Record<string, number> | null;
};

// Types non-artisan exclus des compteurs (règle LOT 1, définie dans data.ts)
function isNonArtisan(type: string): boolean {
  return (NON_ARTISAN_TYPES as string[]).includes(type);
}

// ─── Helpers internes ───────────────────────────────────────────

/** La base est-elle configurée ? Sinon (build/tests sans DATABASE_URL) → statique. */
function dbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/** Base configurée mais en erreur : on logue et on relance (voir en-tête). */
function dbError(scope: string, err: unknown): never {
  console.error(`[db-data] ${scope} — lecture DB impossible :`, err);
  throw err;
}

/** Colonnes publiques d'un artisan, catégorie jointe (JOIN, pas de N+1). */
const publicArtisanColumns = {
  id: artisans.id,
  name: artisans.name,
  slug: artisans.slug,
  type: artisans.type,
  craft: artisans.craft,
  categoryId: artisans.categoryId,
  categoryName: categories.name,
  commune: artisans.commune,
  address: artisans.address,
  latitude: artisans.latitude,
  longitude: artisans.longitude,
  phone: artisans.phone,
  email: artisans.email,
  website: artisans.website,
  shortDescription: artisans.shortDescription,
  longDescription: artisans.longDescription,
  imageUrl: artisans.imageUrl,
  video: artisans.video,
  autre: artisans.autre,
  poinconType: artisans.poinconType,
  poinconModalText: artisans.poinconModalText,
  poinconModalLink: artisans.poinconModalLink,
  jemaParticipant: artisans.jemaParticipant,
};

function selectPublicArtisans() {
  return db
    .select(publicArtisanColumns)
    .from(artisans)
    .leftJoin(categories, eq(artisans.categoryId, categories.id));
}

type PublicArtisanRow = Awaited<ReturnType<typeof selectPublicArtisans>>[number];

function toPublicArtisan(r: PublicArtisanRow): PublicArtisan {
  return { ...r, type: r.type ?? "artisan" };
}

/** Convertit les données statiques au format public (fallback). */
function staticToPublicArtisans(): PublicArtisan[] {
  return staticArtisans.map((a, i) => {
    const cat = allStaticCategories.find((c) => c.name === a.categoryName);
    const detail = getArtisanDetail(a.name);
    return {
      id: `static-${i + 1}`,
      name: a.name,
      slug: a.slug,
      type: a.type,
      craft: a.craft,
      categoryId: cat?.id ?? null,
      categoryName: a.categoryName,
      commune: a.commune,
      address: detail?.address ?? null,
      latitude: a.latitude,
      longitude: a.longitude,
      phone: detail?.phone ?? null,
      email: detail?.email ?? null,
      website: detail?.website ?? null,
      shortDescription: a.shortDescription ?? null,
      longDescription: detail?.description ?? null,
      imageUrl: detail?.image ?? null,
      video: detail?.video ?? null,
      autre: detail?.autre ?? null,
      poinconType: detail?.poinconType ?? null,
      poinconModalText: detail?.poinconModalText ?? null,
      poinconModalLink: detail?.poinconModalLink ?? null,
      jemaParticipant: true,
    };
  });
}

function staticToPublicCategories(): PublicCategory[] {
  return allStaticCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    icon: c.icon,
    color: c.color,
  }));
}

function staticToPublicCommunes(): PublicCommune[] {
  return staticCommunes.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    latitude: c.latitude,
    longitude: c.longitude,
    soutientMag: c.soutientMag,
  }));
}

// ─── Lecture DB ─────────────────────────────────────────────────

/**
 * Toutes les entités publiées, avec leur catégorie (JOIN, pas de N+1),
 * dans l'ordre alphabétique français (voir `compareFr` : l'ORDER BY de la
 * base, en collation C, ne sert qu'à départager les ex æquo).
 * Fallback sur les données statiques si la DB n'est pas configurée.
 */
export const getPublishedArtisans = cache(async (): Promise<PublicArtisan[]> => {
  if (!dbConfigured()) return sortByName(staticToPublicArtisans());
  try {
    const rows = await selectPublicArtisans()
      .where(eq(artisans.published, true))
      .orderBy(asc(artisans.name));

    return sortByName(rows.map(toPublicArtisan));
  } catch (err) {
    return dbError("getPublishedArtisans", err);
  }
});

/**
 * Artisans réels uniquement (exclut écoles, associations, institutions,
 * partenaires). C'est la règle de comptage du LOT 1.
 */
export const getArtisansOnly = cache(async (): Promise<PublicArtisan[]> => {
  const all = await getPublishedArtisans();
  return all.filter((a) => !isNonArtisan(a.type));
});

/**
 * Catégories de domaines d'art uniquement (exclut les catégories
 * institutionnelles). Une catégorie n'est retenue que si elle a au moins
 * un artisan publié rattaché.
 */
export const getArtisanCategories = cache(async (): Promise<PublicCategory[]> => {
  const [allCats, list] = await Promise.all([
    getAllCategories(),
    getArtisansOnly(),
  ]);

  const usedNames = new Set(list.map((a) => a.categoryName).filter(Boolean));

  return allCats.filter(
    (c) => !EXCLUDED_CATEGORY_SLUGS.includes(c.slug) && usedNames.has(c.name),
  );
});

/** Toutes les catégories (y compris institutionnelles). */
export const getAllCategories = cache(async (): Promise<PublicCategory[]> => {
  if (!dbConfigured()) return staticToPublicCategories();
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      icon: r.icon,
      color: r.color,
    }));
  } catch (err) {
    return dbError("getAllCategories", err);
  }
});

/** Communes du canton (avec le drapeau soutien MAG). */
export const getCommunes = cache(async (): Promise<PublicCommune[]> => {
  if (!dbConfigured()) return staticToPublicCommunes();
  try {
    const rows = await db.select().from(communes).orderBy(asc(communes.name));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      latitude: r.latitude,
      longitude: r.longitude,
      soutientMag: r.soutientMag,
    }));
  } catch (err) {
    return dbError("getCommunes", err);
  }
});

/** Communes au format attendu par la carte des soutiens (page Qui sommes-nous). */
export const getCommunesForMap = cache(
  async (): Promise<
    { id: string; name: string; latitude: number; longitude: number; soutientMag: boolean }[]
  > => {
    const list = await getCommunes();
    return list.map((c) => ({
      id: c.id,
      name: c.name,
      latitude: c.latitude ?? 0,
      longitude: c.longitude ?? 0,
      soutientMag: c.soutientMag ?? false,
    }));
  },
);

/** Une entité publiée par son slug (requête ciblée, pas de scan de la table). */
export const getArtisanBySlugDb = cache(
  async (slug: string): Promise<PublicArtisan | null> => {
    if (!dbConfigured()) {
      return staticToPublicArtisans().find((a) => a.slug === slug) ?? null;
    }
    try {
      const [row] = await selectPublicArtisans()
        .where(and(eq(artisans.slug, slug), eq(artisans.published, true)))
        .limit(1);
      return row ? toPublicArtisan(row) : null;
    } catch (err) {
      return dbError("getArtisanBySlugDb", err);
    }
  },
);

/**
 * Entités d'une catégorie (par slug de catégorie), hors types non-artisan,
 * dans l'ordre alphabétique français (comme `getPublishedArtisans`).
 */
export const getArtisansByCategoryDb = cache(
  async (categorySlug: string): Promise<PublicArtisan[]> => {
    if (EXCLUDED_CATEGORY_SLUGS.includes(categorySlug)) return [];
    const cat = (await getAllCategories()).find((c) => c.slug === categorySlug);
    if (!cat) return [];

    let list: PublicArtisan[];
    if (!dbConfigured()) {
      list = staticToPublicArtisans().filter((a) => a.categoryName === cat.name);
    } else {
      try {
        const rows = await selectPublicArtisans()
          .where(and(eq(categories.slug, categorySlug), eq(artisans.published, true)))
          .orderBy(asc(artisans.name));
        list = rows.map(toPublicArtisan);
      } catch (err) {
        return dbError("getArtisansByCategoryDb", err);
      }
    }
    return sortByName(list.filter((a) => !isNonArtisan(a.type)));
  },
);

/** Éditions JEMA, la plus récente d'abord. */
export const getJemaEditions = cache(async (): Promise<PublicJemaEdition[]> => {
  // Pas d'éditions en statique : base non configurée → liste vide
  if (!dbConfigured()) return [];
  try {
    const rows = await db
      .select()
      .from(jemaEditions)
      .orderBy(desc(jemaEditions.year));
    return rows.map((r) => ({
      id: r.id,
      year: r.year,
      title: r.title,
      startDate: r.startDate,
      endDate: r.endDate,
      isUpcoming: r.isUpcoming,
      isPast: r.isPast,
      description: r.description,
      highlight: r.highlight,
      programUrl: r.programUrl,
      stats: r.stats ?? null,
    }));
  } catch (err) {
    return dbError("getJemaEditions", err);
  }
});

/**
 * Répartit les éditions JEMA :
 * - `upcoming` : la prochaine édition à venir (l'année la plus proche) ;
 * - `past` : les éditions marquées « passée » et non « à venir », la plus
 *   récente d'abord. Une édition ni passée ni à venir (brouillon) n'apparaît pas.
 * Source unique pour la page /jema, les pages /jema/[année] et le sitemap.
 */
export function splitJemaEditions(editions: PublicJemaEdition[]): {
  upcoming: PublicJemaEdition | null;
  past: PublicJemaEdition[];
} {
  const upcoming =
    editions.filter((e) => e.isUpcoming).sort((a, b) => a.year - b.year)[0] ?? null;
  const past = editions
    .filter((e) => e.isPast && !e.isUpcoming)
    .sort((a, b) => b.year - a.year);
  return { upcoming, past };
}

// ─── Helpers de comptage (règles LOT 1) ─────────────────────────

/** Nombre de métiers dédoublonnés (un métier = une occurrence). */
export function countCrafts(list: PublicArtisan[]): number {
  return new Set(list.map((a) => a.craft).filter(Boolean)).size;
}

/**
 * Nombre de communes distinctes de la liste reçue (l'accueil passe les
 * artisan·e·s seul·e·s, chiffre MAG). Même clé que la carte des communes :
 * « Perly » et « Perly-Certoux », « Vandœuvres » et « Vandoeuvres » comptent une fois.
 */
export function countCommunes(list: PublicArtisan[]): number {
  return new Set(list.map((a) => (a.commune ? communeKey(a.commune) : "")).filter(Boolean)).size;
}
