import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { canOptimizeImage } from "@/lib/utils";

/* ─── Vocabulaire éditorial (refonte 2026-09) ──────────────────
   Sur-titre en capitales espacées, grands titres serif Black,
   aplats sable / quasi-noir, photos à coins francs (radius 4px). */

export function Eyebrow({
  children,
  tone = "red",
  className = "",
}: {
  children: ReactNode;
  tone?: "red" | "cream";
  className?: string;
}) {
  return (
    <span
      className={`block text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] ${
        tone === "red" ? "text-mag-red" : "text-mag-cream"
      } ${className}`}
    >
      {children}
    </span>
  );
}

type PageHeroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  /** Deuxième ligne du titre, en rouge. */
  accent?: ReactNode;
  lead?: ReactNode;
  image?: string | null;
  imageAlt?: string;
  /** Légende posée en bas de la photo (nom, métier, commune). */
  caption?: ReactNode;
  children?: ReactNode;
};

/**
 * En-tête de page : aplat sable, grand titre serif, chapô.
 * Avec `image`, la photo occupe la moitié droite à fond perdu.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  lead,
  image,
  imageAlt = "",
  caption,
  children,
}: PageHeroProps) {
  return (
    <section className="relative bg-mag-sand grain-overlay border-b border-mag-cream overflow-hidden">
      <div
        className={`mx-auto max-w-7xl ${
          image ? "lg:grid lg:grid-cols-2 lg:max-w-none" : ""
        }`}
      >
        <div
          className={`px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 ${
            image ? "lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-16" : ""
          }`}
        >
          {eyebrow && (
            <Reveal>
              <Eyebrow className="mb-6">✦&nbsp;&nbsp;{eyebrow}</Eyebrow>
            </Reveal>
          )}
          <Reveal delay={0.08}>
            <h1 className="font-serif font-black text-mag-dark tracking-tight leading-[0.95] text-5xl sm:text-6xl lg:text-7xl">
              {title}
              {accent && (
                <>
                  <br />
                  <span className="text-mag-red">{accent}</span>
                </>
              )}
            </h1>
          </Reveal>
          {lead && (
            <Reveal delay={0.16}>
              <div className="mt-8 max-w-2xl text-lg sm:text-xl text-mag-dark/80 leading-relaxed">
                {lead}
              </div>
            </Reveal>
          )}
          {children && (
            <Reveal delay={0.24}>
              <div className="mt-10">{children}</div>
            </Reveal>
          )}
        </div>

        {image && (
          <div className="relative min-h-[320px] sm:min-h-[420px] lg:min-h-0 bg-mag-cream">
            <Image
              src={image}
              unoptimized={!canOptimizeImage(image)}
              alt={imageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover animate-clip-reveal"
            />
            {caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mag-footer/80 to-transparent px-6 sm:px-10 pt-24 pb-8 text-white">
                {caption}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Titre de section : sur-titre + grand titre serif, avec un aparté à droite. */
export function SectionHeader({
  eyebrow,
  title,
  aside,
  tone = "light",
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  aside?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-12 mb-10 sm:mb-14 ${className}`}
    >
      <Reveal>
        {eyebrow && (
          <Eyebrow tone={tone === "dark" ? "cream" : "red"} className="mb-4">
            {eyebrow}
          </Eyebrow>
        )}
        <h2
          className={`font-serif font-black tracking-tight leading-[1.02] text-4xl sm:text-5xl lg:text-6xl ${
            tone === "dark" ? "text-white" : "text-mag-dark"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {aside && (
        <Reveal delay={0.1} className="lg:max-w-md shrink-0">
          <div
            className={`text-base sm:text-lg leading-relaxed ${
              tone === "dark" ? "text-mag-cream/80" : "text-mag-dark/75"
            }`}
          >
            {aside}
          </div>
        </Reveal>
      )}
    </div>
  );
}
