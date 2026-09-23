"use client";

import dynamic from "next/dynamic";
import { Reveal } from "@/components/ui/Reveal";
import type { MapCommune } from "@/components/map/CommunesSoutiensMap";

const CommunesSoutiensMap = dynamic(
  () => import("@/components/map/CommunesSoutiensMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] sm:h-[500px] rounded-xl bg-mag-cream/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-8 h-8 border-2 border-mag-red/30 border-t-mag-red rounded-full animate-spin" />
          <p className="text-mag-gray text-sm">Chargement de la carte…</p>
        </div>
      </div>
    ),
  },
);

export function CommunesMapSection({ communes }: { communes: MapCommune[] }) {
  const partenaires = communes.filter((c) => c.soutientMag);
  const enRecherche = partenaires.filter((c) => c.hasArtisans === false).map((c) => c.name);
  return (
    <>
      <Reveal delay={0.1}>
        <div className="rounded-2xl overflow-hidden shadow-lg shadow-mag-dark/5 card-hover">
          <CommunesSoutiensMap communes={communes} />
        </div>
      </Reveal>

      {/* Légende — seules les communes partenaires, mêmes couleurs que la carte */}
      <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-mag-gray">
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 h-3 rounded-[2px] bg-mag-red/60" aria-hidden />
          Commune partenaire
        </span>
        {enRecherche.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-3 rounded-[2px] bg-stone-400/30 ring-2 ring-inset ring-mag-red" aria-hidden />
            Commune partenaire en recherche d&apos;artisan·e·s
          </span>
        )}
      </div>

      {/* La carte n'est pas lisible au lecteur d'écran : la liste l'est. */}
      <p className="sr-only">
        {partenaires.length > 0
          ? `Communes partenaires : ${partenaires.map((c) => c.name).join(", ")}.${
              enRecherche.length > 0 ? ` En recherche d'artisan·e·s : ${enRecherche.join(", ")}.` : ""
            }`
          : "Aucune commune partenaire n'est encore enregistrée."}
      </p>
    </>
  );
}
