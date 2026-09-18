import type { NextConfig } from "next";
import { allRedirects } from "./src/lib/redirects";

const nextConfig: NextConfig = {
  // Marque pg comme package externe côté serveur pour éviter
  // qu'il soit bundlé dans le code client/edge.
  serverExternalPackages: ["pg"],

  images: {
    remotePatterns: [
      // Vercel Blob — images des artisans, galeries JEMA, logos
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "vercel-blob.com" },
      // Images hébergées sur le site Joomla actuel (migration progressive)
      { protocol: "https", hostname: "metiersdart-geneve.ch" },
    ],
  },

  // Redirections 301 depuis l'ancien site Joomla
  async redirects() {
    return allRedirects.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: true, // 301
    }));
  },

  // Silencer le warning pg-native en build de production (webpack)
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "pg-native": false,
    };
    return config;
  },
};

export default nextConfig;
