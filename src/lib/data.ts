// Données de référence pour le développement sans base de données.
// Ces données reflètent le contenu du site actuel metiersdart-geneve.ch
// et servent aussi de seed pour la base PostgreSQL Neon.

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string; // classe Font Awesome (ex: "fas fa-tshirt")
  color: string;
};

export type ArtisanData = {
  id: string;
  name: string;
  slug: string;
  type: "artisan" | "atelier" | "entreprise" | "institution_culturelle" | "ecole_formatrice" | "association_professionnelle" | "partenaire";
  craft: string;
  categoryName: string;
  commune: string;
  latitude: number;
  longitude: number;
  shortDescription?: string;
};

export const categories: CategoryData[] = [
  { id: "cat-textile", name: "Art du textile", slug: "art-du-textile", icon: "fas fa-tshirt", color: "#a8554f", description: "Couture, feutre, broderie, tapisserie, teinture." },
  { id: "cat-cuir", name: "Art du cuir", slug: "art-du-cuir", icon: "fas fa-stamp", color: "#8b4513", description: "Maroquinerie, sellerie, cordonnerie, bottier." },
  { id: "cat-horlogerie", name: "Art de l'horlogerie et de la bijouterie", slug: "art-de-lhorlogerie-et-de-la-bijouterie", icon: "fas fa-clock", color: "#c9a227", description: "Horlogerie, bijouterie, joaillerie, sertissage, émaillage." },
  { id: "cat-bois", name: "Art du bois", slug: "art-du-bois", icon: "fas fa-tree", color: "#8b5e34", description: "Ébénisterie, menuiserie, sculpture sur bois, encadrement." },
  { id: "cat-papier", name: "Art du papier", slug: "art-du-papier", icon: "fas fa-newspaper", color: "#d4a574", description: "Reliure, typographie, sérigraphie, découpage." },
  { id: "cat-facture", name: "Art de la facture instrumentale", slug: "art-de-la-facture-instrumentale", icon: "fas fa-guitar", color: "#7d6b44", description: "Lutherie, facture de pianos." },
  { id: "cat-terre", name: "Art de la terre", slug: "art-de-la-terre", icon: "fas fa-hands", color: "#a67b5b", description: "Céramique, compositions végétales durables." },
  { id: "cat-appliques", name: "Arts appliqués", slug: "arts-appliques", icon: "fas fa-paint-brush", color: "#b42c36", description: "Maquettiste, calligraphie, peintre décorateur." },
  { id: "cat-verre", name: "Art du verre", slug: "art-du-verre", icon: "fas fa-wine-glass", color: "#5b9aa0", description: "Verrier, oculariste." },
  { id: "cat-pierre", name: "Art de la pierre", slug: "art-de-la-pierre", icon: "fas fa-gavel", color: "#787878", description: "Sculpture, taille, marbrerie, staff." },
  { id: "cat-metal", name: "Art du métal", slug: "art-du-metal", icon: "fas fa-link", color: "#555555", description: "Forge, fonderie, ferblanterie, coutellerie, gravure." },
  { id: "cat-conservation", name: "Art de la conservation et de la restauration", slug: "art-de-la-conservation-et-de-la-restauration", icon: "fas fa-book", color: "#4a7c59", description: "Restauration d'œuvres d'art, de tableaux, de documents." },
  { id: "cat-institutions", name: "Institutions culturelles", slug: "institutions-culturelles", icon: "fas fa-university", color: "#2c5f7c", description: "Musées, théâtres, conservatoires, bibliothèques." },
  { id: "cat-ecoles", name: "Écoles formatrices", slug: "ecoles-formatrices", icon: "fas fa-school", color: "#1a5276", description: "Centres de formation professionnelle aux métiers d'art." },
  { id: "cat-associations", name: "Associations professionnelles", slug: "associations-professionnelles", icon: "fas fa-people-arrows", color: "#6c757d", description: "Associations et labels des métiers d'art." },
  { id: "cat-partenaires", name: "Partenaires", slug: "partenaires", icon: "fas fa-handshake", color: "#999999", description: "Partenaires institutionnels de MAG." },
];

// Coordonnées approximatives par commune genevoise
const cc: Record<string, [number, number]> = {
  Genève: [46.2044, 6.1432], Carouge: [46.1947, 6.1376], Lancy: [46.1865, 6.1218],
  Vernier: [46.2214, 6.0931], "Chêne-Bourg": [46.2497, 6.1969], Bardonnex: [46.1319, 6.0806],
  Veyrier: [46.1656, 6.175], "Plan-les-Ouates": [46.1736, 6.1089], Bernex: [46.1744, 6.0758],
  Meinier: [46.2336, 6.2186], "Pregny-Chambésy": [46.2403, 6.1419], Cologny: [46.2153, 6.1769],
  Jussy: [46.25, 6.2667], Satigny: [46.2053, 6.0458], Vandoeuvres: [46.2472, 6.2014],
  Perly: [46.1597, 6.0833], Puplinge: [46.2453, 6.22], Dardagny: [46.1833, 6.05],
  "Aire-la-Ville": [46.1667, 6.0667], Bellevue: [46.2417, 6.15], Meyrin: [46.2247, 6.0833],
  Presinge: [46.2417, 6.225], Clarens: [46.45, 6.85],
};

function coords(commune: string): [number, number] {
  return cc[commune] ?? [46.2044, 6.1432];
}

function slug(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

type RawArtisan = {
  name: string; craft: string; cat: string; commune: string; type?: ArtisanData["type"]; lat?: number; lon?: number;
};

const rawArtisans: RawArtisan[] = [
  // Art du cuir
  { name: "AP Sellerie, Anne Ponthenier", craft: "Sellière", cat: "Art du cuir", commune: "Vernier", lat: 46.2205324, lon: 6.0817526 },
  { name: "Atelier René René, Sylvia Blondin", craft: "Maroquinière", cat: "Art du cuir", commune: "Carouge", lat: 46.1865756, lon: 6.1406343 },
  { name: "L'Antre-Peaux, Chris Murner", craft: "Maroquinière", cat: "Art du cuir", commune: "Carouge", lat: 46.1811788, lon: 6.1409356 },
  { name: "Bracelets Protexo SA", craft: "Maroquinière", cat: "Art du cuir", commune: "Meinier", lat: 46.2474811, lon: 6.2188993 },
  { name: "Luxhous SA", craft: "Sellière", cat: "Art du cuir", commune: "Vernier", lat: 46.2076952, lon: 6.0988601 },
  { name: "Roger Truan SA", craft: "Gainière", cat: "Art du cuir", commune: "Carouge", lat: 46.1865995, lon: 6.129244 },
  { name: "Sellerie Kühnen, Fabienne Panelati", craft: "Sellière", cat: "Art du cuir", commune: "Genève" },
  { name: "Sellerie moto Dubouloz, Simon Dubouloz", craft: "Sellier harnacheur", cat: "Art du cuir", commune: "Plan-les-Ouates" },
  { name: "Vaudaux Haute Gainerie depuis 1908", craft: "Gainière", cat: "Art du cuir", commune: "Vernier" },
  { name: "Cyril Sanglier", craft: "Sellier harnacheur", cat: "Art du cuir", commune: "Chêne-Bourg", lat: 46.1990442, lon: 6.2023354 },
  { name: "Orthethic", craft: "Bottier", cat: "Art du cuir", commune: "Carouge", lat: 46.180386, lon: 6.1439155 },
  { name: "L'Artisan du Cuir — Frédéric Viollet", craft: "Maroquinier", cat: "Art du cuir", commune: "Genève" },
  { name: "Cordonnerie Seror — Yohan Seror", craft: "Bottière • Cordonnière", cat: "Art du cuir", commune: "Genève" },

  // Horlogerie & bijouterie
  { name: "Atelier Gibson, Oran Gibson", craft: "Bijoutier • Joaillier • Sertisseur", cat: "Art de l'horlogerie et de la bijouterie", commune: "Carouge", lat: 46.1862457, lon: 6.1442456 },
  { name: "Atelier Galerie Igor Siebold", craft: "Bijoutier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Carouge", lat: 46.1863027, lon: 6.1406997 },
  { name: "Atelier Laurent Jolliet", craft: "Bijoutier • Chaîniste", cat: "Art de l'horlogerie et de la bijouterie", commune: "Vernier", lat: 46.2072281, lon: 6.0987292 },
  { name: "Blandenier SA", craft: "Graveur • Emailleur • Sertisseur", cat: "Art de l'horlogerie et de la bijouterie", commune: "Genève", lat: 46.1683226, lon: 6.1084211 },
  { name: "Catherine Schmeer bijouterie-joaillerie", craft: "Bijoutier • Joaillier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Carouge" },
  { name: "Galerie H — Valérie Hangel", craft: "Bijoutier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Carouge" },
  { name: "Ingrid Schmidt Schmuck", craft: "Bijoutier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Genève", lat: 46.1989193, lon: 6.1375469 },
  { name: "Les Insolites, Nina Mathèz-Loïc", craft: "Bijoutier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Carouge" },
  { name: "Marina Magnin Bucher — Ninamarina", craft: "Bijoutier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Veyrier" },
  { name: "Samuel Gillioz", craft: "Horloger", cat: "Art de l'horlogerie et de la bijouterie", commune: "Plan-les-Ouates", lat: 46.1646604, lon: 6.1028328 },
  { name: "Stéphane Greco", craft: "Décorateur sur mouvement horloger", cat: "Art de l'horlogerie et de la bijouterie", commune: "Plan-les-Ouates", lat: 46.1709706, lon: 6.1081173 },
  { name: "Elisa Neveceral-Pantazopoulos", craft: "Bijoutière", cat: "Art de l'horlogerie et de la bijouterie", commune: "Genève", lat: 46.186287, lon: 6.1400975 },
  { name: "Karine Dupont", craft: "Bijoutière-joaillère", cat: "Art de l'horlogerie et de la bijouterie", commune: "Carouge", lat: 46.1863031, lon: 6.1409428 },
  { name: "Traditech", craft: "Sertisseur", cat: "Art de l'horlogerie et de la bijouterie", commune: "Genève", lat: 46.1931996, lon: 6.1295547 },
  { name: "Atelier Orange — Aline Hiltpold", craft: "Bijoutière • Joaillière", cat: "Art de l'horlogerie et de la bijouterie", commune: "Carouge" },
  { name: "Dorothée Loustalot", craft: "Bijoutière • Design de bijoux", cat: "Art de l'horlogerie et de la bijouterie", commune: "Genève", lat: 46.2068541, lon: 6.1410937 },
  { name: "Sandy Rey", craft: "Bijoutière • Joaillière", cat: "Art de l'horlogerie et de la bijouterie", commune: "Genève", lat: 46.206408, lon: 6.1298782 },
  { name: "Lucas Hage", craft: "Bijoutier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Genève", lat: 46.2017559, lon: 6.1466014 },
  { name: "Atelier 9", craft: "Bijoutier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Genève", lat: 46.206623, lon: 6.1429975 },
  { name: "Cyril Seiler", craft: "Bijoutier • Joaillier", cat: "Art de l'horlogerie et de la bijouterie", commune: "Carouge", lat: 46.1853882, lon: 6.1401906 },

  // Art du textile
  { name: "Atelier Matin Bleu, Emmanuelle Bronzino", craft: "Tailleur • Couturier", cat: "Art du textile", commune: "Carouge", lat: 46.1829788, lon: 6.1415139 },
  { name: "Carolina Véliz, créatrice textile", craft: "Feutrière", cat: "Art du textile", commune: "Carouge" },
  { name: "Mercerie Catherine B", craft: "Brodeur", cat: "Art du textile", commune: "Genève", lat: 46.2030207, lon: 6.1441206 },
  { name: "Peter Kammermann", craft: "Tapissier", cat: "Art du textile", commune: "Carouge", lat: 46.1853582, lon: 6.1400707 },
  { name: "Revenga Chemisiers Genevois, Josefa Garcia Lozano", craft: "Couturier • Tailleur", cat: "Art du textile", commune: "Genève" },
  { name: "Atelier Contre-Jour", craft: "Fabricant d'abat-jour", cat: "Art du textile", commune: "Genève", lat: 46.2003162, lon: 6.1394378 },
  { name: "Lachenal SA", craft: "Courtepointier", cat: "Art du textile", commune: "Genève", lat: 46.209923, lon: 6.1375306 },
  { name: "Laura Catignani", craft: "Modiste", cat: "Art du textile", commune: "Genève", lat: 46.2159571, lon: 6.1461852 },
  { name: "De fil en fil — Nicole Genoud", craft: "Tisserande", cat: "Art du textile", commune: "Genève" },
  { name: "Maïa Kvasnikova", craft: "Fabricante d'objets en textiles", cat: "Art du textile", commune: "Genève" },
  { name: "Baxter Sérigraphie", craft: "Imprimeur en sérigraphie", cat: "Art du textile", commune: "Genève" },
  { name: "Jean-Robert Gase", craft: "Chapelier • Modiste", cat: "Art du textile", commune: "Genève", lat: 46.2016144, lon: 6.1324226 },
  { name: "mademoiselle L — Laurence Imstepf", craft: "Couturière", cat: "Art du textile", commune: "Genève" },
  { name: "Jardin des Couleurs — Jaky Roland", craft: "Teinturière", cat: "Art du textile", commune: "Bernex" },

  // Art du bois
  { name: "L'Atelier B, Belén Ferrier et Mohamed Kahlia", craft: "Doreur • Encadreur • Peintre-décorateur", cat: "Art du bois", commune: "Genève" },
  { name: "Barro & Cie SA", craft: "Menuisier", cat: "Art du bois", commune: "Carouge", lat: 46.1835672, lon: 6.1449097 },
  { name: "Jérôme Blanc", craft: "Tourneur sur bois • Sculpteur sur bois", cat: "Art du bois", commune: "Carouge", lat: 46.1901595, lon: 6.1378303 },
  { name: "Marco Colucci Encadrement + Art", craft: "Encadreur", cat: "Art du bois", commune: "Genève" },
  { name: "Denis Schott & Fille", craft: "Encadreur d'art", cat: "Art du bois", commune: "Genève", lat: 46.2021615, lon: 6.1460109 },
  { name: "Gaspard Meier", craft: "Charpentier ornemaniste", cat: "Art du bois", commune: "Bernex", lat: 46.2005103, lon: 6.086904 },
  { name: "Fanny Kopp", craft: "Graveuse sur bois", cat: "Art du bois", commune: "Vernier", lat: 46.1970797, lon: 6.090649 },
  { name: "Marco Olivet", craft: "Encadreur d'art", cat: "Art du bois", commune: "Carouge", lat: 46.1882479, lon: 6.1326287 },
  { name: "Rosso encadrements", craft: "Encadreur", cat: "Art du bois", commune: "Chêne-Bourg", lat: 46.1954205, lon: 6.1969054 },
  { name: "Sakran SA — Pascal Sakran", craft: "Menuisier • Ebéniste", cat: "Art du bois", commune: "Carouge" },
  { name: "Olivier Veuthey", craft: "Menuisier • Ebéniste", cat: "Art du bois", commune: "Bernex", lat: 46.1799605, lon: 6.0807997 },
  { name: "Art & Maison SA", craft: "Parqueteur", cat: "Art du bois", commune: "Bellevue", lat: 46.2548126, lon: 6.1544873 },
  { name: "Bespoak — Jason Lugrin", craft: "Menuisier • Ebéniste", cat: "Art du bois", commune: "Satigny" },
  { name: "Ebénisterie Nikles — Philippe Nikles", craft: "Restaurateur de meubles anciens", cat: "Art du bois", commune: "Genève" },
  { name: "Sylvio Asseo", craft: "Sculpteur sur bois", cat: "Art du bois", commune: "Puplinge", lat: 46.2098273, lon: 6.2388785 },

  // Art du papier
  { name: "Atelier ABR Sàrl", craft: "Relieur • Doreur", cat: "Art du papier", commune: "Vernier", lat: 46.2207487, lon: 6.0955816 },
  { name: "Loutan & Cie SA", craft: "Imprimeur en sérigraphe", cat: "Art du papier", commune: "Genève", lat: 46.20255, lon: 6.1602218 },
  { name: "Réhane Favereau", craft: "Découpeuse sur papier", cat: "Art du papier", commune: "Pregny-Chambésy", lat: 46.2472829, lon: 6.1399628 },
  { name: "Duo d'art", craft: "Imprimeur en sérigraphie", cat: "Art du papier", commune: "Vernier", lat: 46.2185372, lon: 6.0775155 },

  // Facture instrumentale
  { name: "Atelier de lutherie, Béatrice de Haller", craft: "Luthier", cat: "Art de la facture instrumentale", commune: "Carouge", lat: 46.185861, lon: 6.1412526 },
  { name: "Maître Luthier François Lebeau", craft: "Luthier", cat: "Art de la facture instrumentale", commune: "Genève", lat: 46.2027973, lon: 6.1390939 },
  { name: "Pianos-Service P. Fuhrer", craft: "Facteur de pianos", cat: "Art de la facture instrumentale", commune: "Genève", lat: 46.1873756, lon: 6.1289429 },
  { name: "Bernard Bossert", craft: "Luthier du quatuor", cat: "Art de la facture instrumentale", commune: "Genève", lat: 46.2003465, lon: 6.1422558 },
  { name: "Vincenti Guitares — Guillaume Dayer", craft: "Luthier en guitare", cat: "Art de la facture instrumentale", commune: "Genève" },

  // Art de la terre
  { name: "ICI Céramique — Elise Naville", craft: "Céramiste", cat: "Art de la terre", commune: "Genève" },
  { name: "La Maison de Nathalie", craft: "Céramiste", cat: "Art de la terre", commune: "Puplinge", lat: 46.2109135, lon: 6.2299124 },
  { name: "Poterie Passion — Sylvie Cellerino", craft: "Céramiste", cat: "Art de la terre", commune: "Presinge" },
  { name: "Héloïse Ihne", craft: "Fabricante de compositions et décors végétaux stables et durables", cat: "Art de la terre", commune: "Carouge", lat: 46.1855375, lon: 6.14111 },
  { name: "Mioko — Marie Faurax", craft: "Céramiste", cat: "Art de la terre", commune: "Vandoeuvres" },
  { name: "L'Atelier de céramique, Annick Berclaz", craft: "Céramiste", cat: "Art de la terre", commune: "Genève" },

  // Arts appliqués
  { name: "Atelier C1, Thierry Reverdin", craft: "Maquettiste", cat: "Arts appliqués", commune: "Genève", lat: 46.2054948, lon: 6.1302024 },
  { name: "Atelier d'Art, Jacky Riesen", craft: "Lustrier", cat: "Arts appliqués", commune: "Lancy", lat: 46.1805996, lon: 6.129284 },
  { name: "Atelier JMS, Jean-Michel Staudhammer", craft: "Maquettiste", cat: "Arts appliqués", commune: "Chêne-Bourg", lat: 46.1949129, lon: 6.1964721 },
  { name: "Emmanuelle Zem Rohner", craft: "Peintre décorateur • Peintre en décor du patrimoine", cat: "Arts appliqués", commune: "Genève", lat: 46.1995192, lon: 6.1382262 },
  { name: "Finissimo Reliure — Alexis De Los Santos", craft: "Relieur", cat: "Arts appliqués", commune: "Carouge" },
  { name: "Yvan Hostettler", craft: "Calligraphe", cat: "Arts appliqués", commune: "Genève", lat: 46.2081776, lon: 6.1159264 },
  { name: "Patrick Reymond", craft: "Maquettiste", cat: "Arts appliqués", commune: "Veyrier", lat: 46.1731881, lon: 6.1649475 },
  { name: "Michel'Art — Michel Favre", craft: "Peintre en lettres", cat: "Arts appliqués", commune: "Genève" },
  { name: "La Clef des Coeurs — Daniel Fauchez", craft: "Sculpteur ornemaniste", cat: "Arts appliqués", commune: "Plan-les-Ouates" },
  { name: "L'Atelier de la Cire Genève", craft: "Cirière", cat: "Arts appliqués", commune: "Carouge", lat: 46.186683, lon: 6.1406085 },
  { name: "Jean-Philippe Naef", craft: "Restaurateur d'objets anciens", cat: "Arts appliqués", commune: "Bardonnex", lat: 46.1455572, lon: 6.1288867 },

  // Art du verre
  { name: "Marina Buckel", craft: "Oculariste", cat: "Art du verre", commune: "Perly", lat: 46.1571297, lon: 6.0973373 },
  { name: "Frédéric Taddeï", craft: "Verrier", cat: "Art du verre", commune: "Satigny" },
  { name: "Atelier du Verre — Wilma Besson", craft: "Verrier", cat: "Art du verre", commune: "Genève" },

  // Art de la pierre
  { name: "Atelier CAL'AS (Artisans Sculpteurs), Vincent Du Bois", craft: "Sculpteur sur pierre", cat: "Art de la pierre", commune: "Lancy" },
  { name: "Atelier Comte", craft: "Tailleur de pierre", cat: "Art de la pierre", commune: "Bardonnex", lat: 46.1499108, lon: 6.0980247 },
  { name: "Michel Gillabert", craft: "Sculpteur sur pierre", cat: "Art de la pierre", commune: "Veyrier", lat: 46.1672384, lon: 6.1851676 },
  { name: "Philippe Cartan", craft: "Sculpteur sur pierre", cat: "Art de la pierre", commune: "Plan-les-Ouates" },
  { name: "Mello & Fils SA", craft: "Tailleur de pierre", cat: "Art de la pierre", commune: "Carouge", lat: 46.1822876, lon: 6.1441752 },
  { name: "Daniel Estevez", craft: "Marbrier", cat: "Art de la pierre", commune: "Satigny", lat: 46.1977124, lon: 6.0630898 },
  { name: "Béatrice Archinard", craft: "Sculpteure sur pierre", cat: "Art de la pierre", commune: "Genève", lat: 46.2073993, lon: 6.1620383 },
  { name: "Julien Joselon", craft: "Sculpteur sur pierre", cat: "Art de la pierre", commune: "Dardagny" },
  { name: "Artisan du Staff", craft: "Staffeur-stucateur ornemaniste", cat: "Art de la pierre", commune: "Meyrin", lat: 46.2275265, lon: 6.0632071 },

  // Art du métal
  { name: "Atelier Leckie, Anna Leckie", craft: "Graveuse taille-douce", cat: "Art du métal", commune: "Carouge" },
  { name: "Charles Roulin", craft: "Coutelier d'art", cat: "Art du métal", commune: "Bernex", lat: 46.1641287, lon: 6.0744286 },
  { name: "Cerutti Toitures SA", craft: "Ferblantier ornemaniste", cat: "Art du métal", commune: "Genève", lat: 46.1931182, lon: 6.1296991 },
  { name: "Métaloïd SA", craft: "Constructeur métallique", cat: "Art du métal", commune: "Genève", lat: 46.1648921, lon: 6.1055705 },
  { name: "Joshua Teegarden", craft: "Fondeur", cat: "Art du métal", commune: "Aire-la-Ville", lat: 46.1958699, lon: 6.0931046 },
  { name: "SwissArt Edition — David Chojnacki", craft: "Fondeur d'art", cat: "Art du métal", commune: "Jussy" },
  { name: "Olivier Murner SA", craft: "Constructeur métallique", cat: "Art du métal", commune: "Genève", lat: 46.1943007, lon: 6.1296616 },
  { name: "Art Kern", craft: "Ferronnier • Constructeur métallique", cat: "Art du métal", commune: "Genève", lat: 46.1945515, lon: 6.1262855 },

  // Conservation et restauration
  { name: "Hoffmann Art Management", craft: "Conservateur-restaurateur d'œuvres d'art", cat: "Art de la conservation et de la restauration", commune: "Lancy", lat: 46.1883797, lon: 6.1275419 },
  { name: "La Boutique du Relieur — Michel Magnin", craft: "Restaurateur de documents graphiques et imprimés", cat: "Art de la conservation et de la restauration", commune: "Carouge" },
  { name: "Orth & Fils SÀRL", craft: "Peintre décorateur • Restaurateur d'art", cat: "Art de la conservation et de la restauration", commune: "Genève", lat: 46.1999803, lon: 6.1483327 },
  { name: "Lucien Walker", craft: "Restaurateur de livres", cat: "Art de la conservation et de la restauration", commune: "Carouge", lat: 46.185861, lon: 6.1412526 },
  { name: "Atelier AnD — Anita Durand", craft: "Restauratrice d'œuvres peintes", cat: "Art de la conservation et de la restauration", commune: "Carouge" },
  { name: "Ateliers de restauration de tableaux — Laurent Jornod", craft: "Restaurateur de tableaux", cat: "Art de la conservation et de la restauration", commune: "Genève" },

  // Institutions culturelles
  { name: "Association pour le patrimoine industriel (API)", craft: "Typographe • Imprimeur sur presses anciennes • Relieur", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.207028, lon: 6.1362224},
  { name: "Atelier Genevois de Gravure Contemporaine (AGGC)", craft: "Graveur", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.1989407, lon: 6.1595299},
  { name: "Comédie de Genève", craft: "Costumier", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.2019735, lon: 6.1674459},
  { name: "Conservatoire et Jardin botaniques de Genève", craft: "Préparateur d'herbier", cat: "Institutions culturelles", commune: "Pregny-Chambésy", type: "institution_culturelle" },
  { name: "Fondation Baur, Musée des Arts d'Extrême-Orient", craft: "Scénographe", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" },
  { name: "Fondation Martin Bodmer", craft: "Technicien en conservation d'art", cat: "Institutions culturelles", commune: "Cologny", type: "institution_culturelle" , lat: 46.2152715, lon: 6.1806383},
  { name: "Grand Théâtre de Genève", craft: "Décorateur et accessoiriste costumes", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.2008666, lon: 6.1425027},
  { name: "Muséum d'Histoire Naturelle", craft: "Taxidermiste", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.1990692, lon: 6.1583864},
  { name: "Musée Ariana, musée suisse de la céramique et du verre", craft: "Conservateur-restaurateur", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" },
  { name: "Musée d'Art et d'Histoire", craft: "Conservateur-restaurateur", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.1992351, lon: 6.151634},
  { name: "Bibliothèque de Genève", craft: "Conservateur-restaurateur", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.1988543, lon: 6.1452469},
  { name: "Théâtre de Carouge", craft: "Costumier", cat: "Institutions culturelles", commune: "Carouge", type: "institution_culturelle" , lat: 46.182167, lon: 6.1411031},
  { name: "Musée d'Ethnographie de Genève — MEG", craft: "Conservateur-restaurateur", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" },
  { name: "Musée International de la Réforme", craft: "Graveur • Imprimeur", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.201009, lon: 6.1478968},
  { name: "Collection des Moulages", craft: "Scénographe • Restaurateur", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" , lat: 46.1989193, lon: 6.1375469},
  { name: "Scènes du Grütli", craft: "Scénographe", cat: "Institutions culturelles", commune: "Genève", type: "institution_culturelle" },
  { name: "Ateliers de décors de théâtre", craft: "Fabricant de décors de spectacle", cat: "Institutions culturelles", commune: "Vernier", type: "institution_culturelle" , lat: 46.2039779, lon: 6.0997736},

  // Écoles formatrices
  { name: "CFP Arts Céramique • Bijouterie • Créateur de vêtements", craft: "Céramiste • Bijoutier", cat: "Écoles formatrices", commune: "Genève", type: "ecole_formatrice" },
  { name: "CFP — Construction", craft: "Charpentier • Ebéniste • Menuisier • Constructeur métallique", cat: "Écoles formatrices", commune: "Lancy", type: "ecole_formatrice" },
  { name: "CFPT — Horlogerie", craft: "Horloger", cat: "Écoles formatrices", commune: "Lancy", type: "ecole_formatrice" },
  { name: "CFPne Lullier", craft: "Artisan fleuriste", cat: "Écoles formatrices", commune: "Jussy", type: "ecole_formatrice" , lat: 46.2258738, lon: 6.2530223},
  { name: "HEAD — Haute École d'Art et de Design", craft: "Métiers de la mode", cat: "Écoles formatrices", commune: "Genève", type: "ecole_formatrice" },
  { name: "IPAC Design Genève", craft: "Mode, architecture intérieure et design graphique", cat: "Écoles formatrices", commune: "Vernier", type: "ecole_formatrice" , lat: 46.2196281, lon: 6.1045312},
  { name: "Ateliers horlogers de Van Cleef & Arpels", craft: "Emailleur • Graveur main • Horloger", cat: "Écoles formatrices", commune: "Meyrin", type: "ecole_formatrice" },

  // Associations professionnelles
  { name: "Parcours des Ateliers Carougeois — PAC", craft: "Métiers d'art", cat: "Associations professionnelles", commune: "Carouge", type: "association_professionnelle" },
  { name: "Label Genève", craft: "Métiers d'art", cat: "Associations professionnelles", commune: "Bernex", type: "association_professionnelle" },
  { name: "Association Romande des Métiers de la Bijouterie — ASMEBI", craft: "Bijouterie-joaillerie", cat: "Associations professionnelles", commune: "Carouge", type: "association_professionnelle" },
  { name: "MBG — Groupement des Métiers techniques du Bâtiment Genève", craft: "Métiers du bâtiment", cat: "Associations professionnelles", commune: "Genève", type: "association_professionnelle" },
  { name: "ARMP — Association Romande des Métiers de la Pierre", craft: "Métiers de la pierre", cat: "Associations professionnelles", commune: "Clarens", type: "association_professionnelle" },

  // Partenaires
  { name: "UFGVV", craft: "Horlogerie", cat: "Partenaires", commune: "Genève", type: "partenaire" },
  { name: "OFPC", craft: "Formation", cat: "Partenaires", commune: "Genève", type: "partenaire" },
];

export const artisans: ArtisanData[] = rawArtisans.map((r, i) => {
  const [lat, lng] = r.lat != null && r.lon != null ? [r.lat, r.lon] : coords(r.commune);
  return {
    id: `art-${i + 1}`,
    name: r.name,
    slug: slug(r.name),
    type: r.type ?? "artisan",
    craft: r.craft,
    categoryName: r.cat,
    commune: r.commune,
    latitude: lat,
    longitude: lng,
    shortDescription: `${r.craft} — ${r.commune}`,
  };
});

export function getArtisansByCategory(categorySlug: string): ArtisanData[] {
  return artisans.filter((a) => {
    const cat = categories.find((c) => c.slug === categorySlug);
    return cat && a.categoryName === cat.name;
  });
}

export function getArtisanBySlug(slugStr: string): ArtisanData | undefined {
  return artisans.find((a) => a.slug === slugStr);
}
