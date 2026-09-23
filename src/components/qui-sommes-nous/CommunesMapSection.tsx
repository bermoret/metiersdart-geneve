"use client";

import dynamic from "next/dynamic";
import { Reveal } from "@/components/ui/Reveal";
import type { MapCommune } from "@/components/map/CommunesSoutiensMap";
import { COMMUNE_COLORS, COMMUNE_LABELS } from "@/components/map/communes-palette";

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
  const avecArtisans = communes.filter((c) => !c.soutientMag && c.hasArtisans).map((c) => c.name);
  const legende = [
    { label: COMMUNE_LABELS.partenaire, style: { background: COMMUNE_COLORS.or }, show: partenaires.length > enRecherche.length },
    {
      label: COMMUNE_LABELS.recherche,
      style: { background: COMMUNE_COLORS.gris, boxShadow: `inset 0 0 0 2px ${COMMUNE_COLORS.or}` },
      show: enRecherche.length > 0,
    },
    { label: COMMUNE_LABELS.artisans, style: { background: COMMUNE_COLORS.rose }, show: avecArtisans.length > 0 },
  ].filter((l) => l.show);
  return (
    <>
      <Reveal delay={0.1}>
        <div className="rounded-2xl overflow-hidden shadow-lg shadow-mag-dark/5 card-hover">
          <CommunesSoutiensMap communes={communes} />
        </div>
      </Reveal>

      {/* Légende — catégories et couleurs de la carte fournie par MAG */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-mag-gray">
        {legende.map((l) => (
          <span key={l.label} className="flex items-center gap-2">
            <span className="inline-block w-4 h-3 rounded-[2px] ring-1 ring-inset ring-black/10" style={l.style} aria-hidden />
            {l.label}
          </span>
        ))}
      </div>

      {/* La carte n'est pas lisible au lecteur d'écran : la liste l'est. */}
      <p className="sr-only">
        {partenaires.length > 0
          ? `Communes partenaires : ${partenaires.map((c) => c.name).join(", ")}.${
              enRecherche.length > 0 ? ` En recherche d'artisan·e·s : ${enRecherche.join(", ")}.` : ""
            }`
          : "Aucune commune partenaire n'est encore enregistrée."}
        {avecArtisans.length > 0 ? ` Artisan·e·s présent·e·s dans : ${avecArtisans.join(", ")}.` : ""}
      </p>
    </>
  );
}
