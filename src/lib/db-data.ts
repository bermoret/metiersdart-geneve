// Couche d'accès aux données pour les pages publiques.
//
// PRINCIPE : le site public lit la base de données (source de vérité,
// alimentée par l'admin), avec un FALLBACK sur les données statiques de
// src/lib/data.ts si la base est indisponible (build sans DATABASE_URL,
// base down…). Le site ne casse jamais.
//
// PERF : les fonctions sont enveloppées dans React `cache()`, ce qui
// déduplique les requêtes au sein d'un même rendu (une seule requête
// même si plusieurs composants appellent la fonction). Next.js met en
// cache les pages statiques au build ; les pages dynamiques (revalidate)
// rafraîchissent les données.

import { cache } from "react";
import { db } from "@/db";
import { artisans, categories, communes, jemaEditions } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import {
  artisans as staticArtisans,
  categories as allStaticCategories,
  communesList as staticCommunes,
} from "./data";
import { getArtisanDetail } from "./artisan-details";

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

// Types non-artisan exclus des compteurs (règle LOT 1)
const NON_ARTISAN_TYPES = [
  "institution_culturelle",
  "ecole_formatrice",
  "association_professionnelle",
  "partenaire",
];

const EXCLUDED_CATEGORY_SLUGS = [
  "institutions-culturelles",
  "ecoles-formatrices",
  "associations-professionnelles",
  "partenaires",
];

// ─── Helpers internes ───────────────────────────────────────────

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
 * Toutes les entités publiées, avec leur catégorie (JOIN, pas de N+1).
 * Fallback sur les données statiques si la DB est indisponible.
 */
export const getPublishedArtisans = cache(async (): Promise<PublicArtisan[]> => {
  try {
    const rows = await db
      .select({
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
      })
      .from(artisans)
      .leftJoin(categories, eq(artisans.categoryId, categories.id))
      .where(eq(artisans.published, true))
      .orderBy(asc(artisans.name));

    if (rows.length > 0) {
      return rows.map((r) => ({
        ...r,
        type: r.type ?? "artisan",
      })) as PublicArtisan[];
    }
  } catch {
    // DB indisponible → fallback
  }
  return staticToPublicArtisans();
});

/**
 * Artisans réels uniquement (exclut écoles, associations, institutions,
 * partenaires). C'est la règle de comptage du LOT 1.
 */
export const getArtisansOnly = cache(async (): Promise<PublicArtisan[]> => {
  const all = await getPublishedArtisans();
  return all.filter((a) => !NON_ARTISAN_TYPES.includes(a.type));
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
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder));
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        icon: r.icon,
        color: r.color,
      }));
    }
  } catch {
    // fallback
  }
  return staticToPublicCategories();
});

/** Communes du canton (avec le drapeau soutien MAG). */
export const getCommunes = cache(async (): Promise<PublicCommune[]> => {
  try {
    const rows = await db.select().from(communes).orderBy(asc(communes.name));
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        latitude: r.latitude,
        longitude: r.longitude,
        soutientMag: r.soutientMag,
      }));
    }
  } catch {
    // fallback
  }
  return staticToPublicCommunes();
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

/** Une entité par son slug. */
export const getArtisanBySlugDb = cache(
  async (slug: string): Promise<PublicArtisan | null> => {
    const all = await getPublishedArtisans();
    return all.find((a) => a.slug === slug) ?? null;
  },
);

/** Entités d'une catégorie (par slug de catégorie), hors types non-artisan. */
export const getArtisansByCategoryDb = cache(
  async (categorySlug: string): Promise<PublicArtisan[]> => {
    if (EXCLUDED_CATEGORY_SLUGS.includes(categorySlug)) return [];
    const [cats, list] = await Promise.all([getAllCategories(), getArtisansOnly()]);
    const cat = cats.find((c) => c.slug === categorySlug);
    if (!cat) return [];
    return list.filter((a) => a.categoryName === cat.name);
  },
);

/** Éditions JEMA, la plus récente d'abord. */
export const getJemaEditions = cache(async (): Promise<PublicJemaEdition[]> => {
  try {
    const rows = await db
      .select()
      .from(jemaEditions)
      .orderBy(desc(jemaEditions.year));
    if (rows.length > 0) {
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
    }
  } catch {
    // fallback : pas d'éditions en statique, on renvoie vide
  }
  return [];
});

// ─── Helpers de comptage (règles LOT 1) ─────────────────────────

/** Nombre d'artisans (type = artisan uniquement). */
export function countArtisans(list: PublicArtisan[]): number {
  return list.filter((a) => a.type === "artisan").length;
}

/** Nombre de métiers dédoublonnés (un métier = une occurrence). */
export function countCrafts(list: PublicArtisan[]): number {
  return new Set(list.map((a) => a.craft).filter(Boolean)).size;
}

/** Nombre de communes distinctes — TOUTES entités confondues (règle LOT 1). */
export function countCommunes(list: PublicArtisan[]): number {
  return new Set(list.map((a) => a.commune).filter(Boolean)).size;
}
