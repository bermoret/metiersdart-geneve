// Couleurs de la carte des communes, reprises de la carte fournie par MAG
// (PLAN COMMUNES_MAG, 23.09) : or = commune partenaire, contour or = partenaire
// en recherche d'artisan·e·s, rose = artisan·e·s présent·e·s sans partenariat.
// Module sans Leaflet : partagé par la carte (client) et sa légende (serveur).

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
