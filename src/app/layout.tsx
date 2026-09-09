import type { Metadata } from "next";
import { Inter, Frank_Ruhl_Libre } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
