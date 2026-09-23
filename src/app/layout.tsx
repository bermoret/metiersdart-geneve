import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Frank_Ruhl_Libre } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GTM_LOADER_SCRIPT } from "@/lib/gtm";

// Inter = remplaçant de Muli (sans-serif, lisible, moderne) — Muli est dépréciée sur Google Fonts
const muli = Inter({
  variable: "--font-muli",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Frank Ruhl Libre = police de titres serif élégante utilisée par MAG
const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://metiersdart-geneve.ch"),
  title: {
    default: "Métiers d'Art Genève (MAG)",
    template: "%s — Métiers d'Art Genève",
  },
  description:
    "MAG promeut, fédère et défend les métiers d'art dans le canton de Genève. Découvrez notre répertoire d'artisans, les JEMA et nos événements.",
  keywords: [
    "métiers d'art",
    "artisanat",
    "Genève",
    "JEMA",
    "MAG",
    "artisan",
    "atelier",
  ],
  openGraph: {
    type: "website",
    locale: "fr_CH",
    siteName: "Métiers d'Art Genève",
    url: "https://metiersdart-geneve.ch",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${muli.variable} ${frankRuhl.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-mag-dark">
        {/* GTM via Stape (CookieScript + GA4 dans le conteneur) — exécuté avant
            l'hydratation, dès le chargement du runtime Next. */}
        <Script id="gtm-stape" strategy="beforeInteractive">
          {GTM_LOADER_SCRIPT}
        </Script>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
