// Mapping des redirections 301 depuis l'ancien site Joomla.
// Source : ancien site metiersdart-geneve.ch (Joomla + SP Page Builder)
// Destination : nouveau site Next.js
//
// L'ancien site utilisait des URLs du type :
//   /index.php?option=com_sppagebuilder&view=page&id=XXX&Itemid=YYY
//
// Next.js ne supporte pas les caractères ? et & dans le champ `source`.
// On utilise le champ `has` pour matcher les paramètres de requête.
//
// Ce fichier est extensible : ajouter les mappings au fur et à mesure
// que MAG communique les anciennes URLs à rediriger.

export type RedirectRule = {
  source: string;
  destination: string;
  has?: { type: "query"; key: string; value?: string }[];
};

// Pages statiques Joomla → routes Next.js
export const staticRedirects: RedirectRule[] = [
  // Page d'accueil Joomla → nouvelle racine
  {
    source: "/index.php",
    destination: "/",
  },
  // Répertoire (id=1 = formulaire répertoire)
  {
    source: "/index.php",
    destination: "/repertoire",
    has: [
      { type: "query", key: "view", value: "form" },
      { type: "query", key: "id", value: "1" },
    ],
  },
  // Qui sommes-nous (id=2)
  {
    source: "/index.php",
    destination: "/qui-sommes-nous",
    has: [
      { type: "query", key: "view", value: "page" },
      { type: "query", key: "id", value: "2" },
    ],
  },
  // JEMA (id=3)
  {
    source: "/index.php",
    destination: "/jema",
    has: [
      { type: "query", key: "view", value: "page" },
      { type: "query", key: "id", value: "3" },
    ],
  },
];

// Fiches artisans : l'ancien site utilisait des IDs numériques.
// Le mapping exact sera complété quand MAG fournira la liste des anciennes URLs.
export const artisanRedirects: RedirectRule[] = [
  // Exemple de format (à compléter) :
  // {
  //   source: "/index.php",
  //   destination: "/artisans/ap-sellerie-anne-ponthenier",
  //   has: [
  //     { type: "query", key: "view", value: "page" },
  //     { type: "query", key: "id", value: "630" },
  //   ],
  // },
];

export const allRedirects: RedirectRule[] = [...staticRedirects, ...artisanRedirects];
