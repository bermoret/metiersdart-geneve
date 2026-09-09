import { db } from "@/db";
import { artisans, categories, actualites, jemaEditions, medias } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export type ArtisanRow = typeof artisans.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;

// Catégories
export async function getCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategoryBySlug(slug: string) {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return cat;
}

// Artisans
export async function getArtisans() {
  return db.select().from(artisans).where(eq(artisans.published, true)).orderBy(asc(artisans.name));
}

export async function getArtisanBySlug(slug: string) {
  const [a] = await db.select().from(artisans).where(eq(artisans.slug, slug)).limit(1);
  return a;
}

export async function getArtisansByCategory(categoryId: string) {
  return db
    .select()
    .from(artisans)
    .where(eq(artisans.categoryId, categoryId))
    .orderBy(asc(artisans.name));
}

export async function getAllArtisanSlugs() {
  const all = await db.select({ slug: artisans.slug }).from(artisans).where(eq(artisans.published, true));
  return all.map((a) => ({ slug: a.slug }));
}

// Actualités
export async function getActualites() {
  return db.select().from(actualites).where(eq(actualites.published, true)).orderBy(desc(actualites.createdAt));
}

// JEMA
export async function getJemaEditions() {
  return db.select().from(jemaEditions).orderBy(desc(jemaEditions.year));
}

export async function getJemaEdition(year: number) {
  const [ed] = await db.select().from(jemaEditions).where(eq(jemaEditions.year, year)).limit(1);
  return ed;
}

// Médias
export async function getMedias() {
  return db.select().from(medias).orderBy(desc(medias.sortOrder));
}
