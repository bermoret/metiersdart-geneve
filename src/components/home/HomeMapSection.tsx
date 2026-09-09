"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { categories, artisans } from "@/lib/data";
import type { MapArtisan } from "@/components/map/ArtisansMap";
import { Reveal } from "@/components/ui/Reveal";

const ArtisansMap = dynamic(() => import("@/components/map/ArtisansMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] sm:h-[500px] rounded-2xl bg-mag-cream/40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="inline-block w-8 h-8 border-2 border-mag-red/30 border-t-mag-red rounded-full animate-spin" />
        <p className="text-mag-gray text-sm">Chargement de la carte…</p>
      </div>
    </div>
  ),
});

export function HomeMapSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const mapArtisans: MapArtisan[] = useMemo(
    () =>
      artisans.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        craft: a.craft,
        commune: a.commune,
        latitude: a.latitude,
        longitude: a.longitude,
        category: {
          name: a.categoryName,
          color: categories.find((c) => c.name === a.categoryName)?.color ?? null,
        },
      })),
    [],
  );

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-mag-dark font-serif">
              Trouvez votre artisan·e
            </h2>
            <p className="mt-2 text-mag-dark/60">
              Un point pour chaque artisan·e. Cliquez pour découvrir sa fiche.
            </p>
          </Reveal>
          {/* Filtre par catégorie */}
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">Filtrer par domaine</span>
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="rounded-lg border border-mag-cream bg-white px-4 py-2.5 text-sm font-medium text-mag-dark focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20 transition-colors hover:border-mag-red/40"
            >
              <option value="">Tous les domaines</option>
              {categories
                .filter((c) => c.slug !== "partenaires")
                .map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-2xl overflow-hidden shadow-lg shadow-mag-dark/5 card-hover">
            <ArtisansMap artisans={mapArtisans} selectedCategory={selectedCategory} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
