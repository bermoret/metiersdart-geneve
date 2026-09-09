import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/"],
    },
    sitemap: "https://metiersdart-geneve.ch/sitemap.xml",
    host: "https://metiersdart-geneve.ch",
  };
}
