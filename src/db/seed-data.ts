// Données de seed pour PostgreSQL Neon.
// Réutilise les données statiques de src/lib/data.ts
import { categories as cats, artisans as arts } from "@/lib/data";

export const seedData = {
  categories: cats.map((c, i) => ({
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    icon: c.icon,
    color: c.color,
    sortOrder: i,
  })),
  artisans: arts.map((a) => ({
    name: a.name,
    slug: a.slug,
    type: a.type,
    craft: a.craft,
    commune: a.commune,
    latitude: Math.round(a.latitude * 1e6),
    longitude: Math.round(a.longitude * 1e6),
    shortDescription: a.shortDescription ?? null,
  })),
  partenaires: [
    { name: "UFGVV", abbreviation: "UFGVV", description: "Union des fabricants d'horlogerie de Genève, Vaud et Valais", website: "https://ufgvv.ch", sortOrder: 0 },
    { name: "Office du patrimoine et des sites", abbreviation: "OPS", description: "Sauvegarde du patrimoine, conseil technique, restauration.", website: "https://ge.ch", sortOrder: 1 },
    { name: "OFPC", abbreviation: "OFPC", description: "Office pour l'orientation, la formation professionnelle et continue.", website: "https://ge.ch", sortOrder: 2 },
    { name: "Domus Antiqua Helvetica", abbreviation: "DAH", description: "Sauvegarde et valorisation des demeures historiques.", website: "https://domusgeneve.com", sortOrder: 3 },
  ],
  comite: [
    { name: "Nicolas Rufener", role: "Président", representation: "UAPG", sortOrder: 0 },
    { name: "Liliane Zossou", role: "Vice-Présidente", representation: "État de Genève — DIP", sortOrder: 1 },
    { name: "Andreas Frutiger", role: "Trésorier", representation: "CGAS", sortOrder: 2 },
    { name: "Juliette Zurmühle", role: "Membre", representation: "État de Genève — DEE", sortOrder: 3 },
    { name: "Catherine Lance", role: "Membre", representation: "FER", sortOrder: 4 },
    { name: "Cosima Trabichet-Castan", role: "Membre", representation: "DOMUS Genève", sortOrder: 5 },
    { name: "Chris Murner", role: "Membre", representation: "Parcours des Ateliers Carougeois", sortOrder: 6 },
  ],
  manufacto: [
    { year: 2026, schools: ["École primaire Les Ouches", "École primaire Satigny-Mairie"] },
    { year: 2025, schools: ["École primaire Tambourine", "Cycle d'orientation Sécheron"] },
    { year: 2024, schools: ["École primaire Hugo-de-Senger", "Cycle d'orientation Florence"] },
  ],
};
