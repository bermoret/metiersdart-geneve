import type { NextConfig } from "next";
import { allRedirects } from "./src/lib/redirects";

// ─── Content-Security-Policy (REPORT-ONLY) ─────────────────────
// Observation seulement : rien n'est bloqué, les violations sont envoyées à
// /api/csp-report (logs Vercel). À durcir puis passer en
// `Content-Security-Policy` une fois les rapports lus. Sources :
// - GTM GTM-M6497K4X via le loader Stape (nlpd.metiersdart-geneve.ch), qui
//   charge CookieScript et GA4 G-S9P7VJHKRL (src/lib/gtm.ts) ;
// - scripts inline : runtime Next et snippet GTM → 'unsafe-inline' ;
// - @vercel/analytics (/_vercel/insights en prod, va.vercel-scripts.com en dev) ;
// - tuiles Leaflet : Esri (server.arcgisonline.com) et OpenStreetMap ;
// - images : Vercel Blob, ancien site Joomla, miniatures Vimeo / YouTube ;
// - lecteurs vidéo intégrés (VideoCapsule) : Vimeo, YouTube ;
// - admin : envoi direct des PDF vers l'API Vercel Blob (vercel.com/api/blob).
const isDev = process.env.NODE_ENV === "development";
const CSP_DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://nlpd.metiersdart-geneve.ch",
    "https://*.googletagmanager.com",
    "https://*.cookie-script.com",
    "https://va.vercel-scripts.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://*.cookie-script.com"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://metiersdart-geneve.ch",
    "https://www.metiersdart-geneve.ch",
    "https://*.public.blob.vercel-storage.com",
    "https://vercel-blob.com",
    "https://i.vimeocdn.com",
    "https://i.ytimg.com",
    "https://server.arcgisonline.com",
    "https://*.tile.openstreetmap.org",
    "https://nlpd.metiersdart-geneve.ch",
    "https://*.google-analytics.com",
    "https://*.g.doubleclick.net",
    "https://www.google.com",
    "https://*.googletagmanager.com",
    "https://*.cookie-script.com",
  ],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://nlpd.metiersdart-geneve.ch",
    "https://*.google-analytics.com",
    "https://*.g.doubleclick.net",
    "https://www.google.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
    "https://*.cookie-script.com",
    "https://va.vercel-scripts.com",
    // Envoi direct des PDF de l'admin vers Vercel Blob (MediaModal)
    "https://vercel.com",
  ],
  "frame-src": [
    "https://player.vimeo.com",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://*.googletagmanager.com",
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'self'"],
  "report-uri": ["/api/csp-report"],
};
const CSP = Object.entries(CSP_DIRECTIVES)
  .map(([name, values]) => `${name} ${values.join(" ")}`)
  .join("; ");

const nextConfig: NextConfig = {
  // Marque pg comme package externe côté serveur pour éviter
  // qu'il soit bundlé dans le code client/edge. Comme pg n'est plus bundlé,
  // son import optionnel de `pg-native` n'est plus résolu par le bundler :
  // l'ancien fallback webpack (`pg-native: false`) est devenu inutile, et
  // Next 16 (Turbopack par défaut) refuse de builder avec une clé `webpack`.
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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy-Report-Only", value: CSP }],
      },
    ];
  },

  // Redirections 301 depuis l'ancien site Joomla
  async redirects() {
    return allRedirects.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: true,
      ...(r.has ? { has: r.has } : {}),
    }));
  },
};

export default nextConfig;
