import type { MetadataRoute } from "next";
import {
  getArtisanCategories,
  getArtisansOnly,
  getJemaEditions,
  splitJemaEditions,
} from "@/lib/db-data";

// ISR : le sitemap suit les modifications de l'admin (nouvelles fiches incluses).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://metiersdart-geneve.ch";
  const now = new Date();

  const [artisanCategories, artisansOnly, editions] = await Promise.all([
    getArtisanCategories(),
    getArtisansOnly(),
    getJemaEditions(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/repertoire`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/jema`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/metiers-et-formations`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/qui-sommes-nous`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/l-actu`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/medias`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/manufacto`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = artisanCategories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const artisanRoutes: MetadataRoute.Sitemap = artisansOnly.map((a) => ({
    url: `${baseUrl}/artisans/${a.slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  // Seules les éditions passées ont une page /jema/[année] (cf. splitJemaEditions)
  const jemaRoutes: MetadataRoute.Sitemap = splitJemaEditions(editions).past.map((e) => ({
    url: `${baseUrl}/jema/${e.year}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...categoryRoutes, ...artisanRoutes, ...jemaRoutes];
}
