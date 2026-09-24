// Couleurs de la carte des communes, reprises de la carte fournie par MAG
// (PLAN COMMUNES_MAG, 23.09) : or = commune partenaire, contour or = partenaire
// en recherche d'artisan·e·s, rose = artisan·e·s présent·e·s sans partenariat.
// Module sans Leaflet : partagé par la carte (client) et sa légende (serveur).

import { communeKey } from "@/lib/utils";

export const COMMUNE_COLORS = {
  or: "#b79e56",
  rose: "#f6bcae",
  gris: "#b9b9b9",
} as const;

export const COMMUNE_LABELS = {
  partenaire: "Commune partenaire",
  recherche: "Commune partenaire en recherche d'artisan·e·s",
  artisans: "Artisan·e·s présent·e·s dans la commune",
} as const;

type CommuneFlags = { name: string; soutientMag: boolean; hasArtisans?: boolean };

/**
 * Communes fusionnées par `communeKey` : deux fiches pour la même commune
 * (« Grand-Saconnex » et « Le Grand-Saconnex », que l'unicité du nom en base
 * laisse passer) n'en font qu'une, partenaire ou avec artisan·e·s si l'une l'est.
 * Carte et légende partent de cette même liste.
 */
export function mergeCommunes<T extends CommuneFlags>(list: readonly T[]): Map<string, T> {
  const byKey = new Map<string, T>();
  for (const c of list) {
    const k = communeKey(c.name);
    const prev = byKey.get(k);
    byKey.set(
      k,
      prev
        ? {
            ...prev,
            soutientMag: prev.soutientMag || c.soutientMag,
            hasArtisans: prev.hasArtisans || c.hasArtisans,
          }
        : c,
    );
  }
  return byKey;
}
