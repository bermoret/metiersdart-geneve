import type { MetadataRoute } from "next";
import { categories, artisans } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://metiersdart-geneve.ch";
  const now = new Date();

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

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const artisanRoutes: MetadataRoute.Sitemap = artisans.map((a) => ({
    url: `${baseUrl}/artisans/${a.slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...artisanRoutes];
}
