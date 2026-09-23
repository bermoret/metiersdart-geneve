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
  const supporters = communes.filter((c) => c.soutientMag).map((c) => c.name);
  return (
    <>
      <Reveal delay={0.1}>
        <div className="rounded-2xl overflow-hidden shadow-lg shadow-mag-dark/5 card-hover">
          <CommunesSoutiensMap communes={communes} />
        </div>
      </Reveal>

      {/* Légende — mêmes couleurs que les territoires de la carte */}
      <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-mag-gray">
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 h-3 rounded-[2px] bg-mag-red/60" />
          Commune qui soutient MAG
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 h-3 rounded-[2px] bg-stone-400/30" />
          Commune non-soutien
        </span>
      </div>

      {/* La carte n'est pas lisible au lecteur d'écran : la liste l'est. */}
      <p className="sr-only">
        {supporters.length > 0
          ? `Communes qui soutiennent MAG : ${supporters.join(", ")}.`
          : "Aucune commune n'est encore enregistrée comme soutien de MAG."}
      </p>
    </>
  );
}
