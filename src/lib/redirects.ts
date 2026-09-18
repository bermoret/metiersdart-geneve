// Mapping des redirections 301 depuis l'ancien site Joomla.
// Source : ancien site metiersdart-geneve.ch (Joomla + SP Page Builder)
// Destination : nouveau site Next.js
//
// L'ancien site utilisait des URLs du type :
//   /index.php?option=com_sppagebuilder&view=page&id=XXX&Itemid=YYY
//
// Ce fichier est extensible : ajouter les mappings au fur et à mesure
// que MAG communique les anciennes URLs à rediriger.
//
// Format : { source, destination }

export type Redirect = {
  source: string;
  destination: string;
};

// Pages statiques Joomla → routes Next.js
export const staticRedirects: Redirect[] = [
  // Pages d'accueil
  { source: "/index.php", destination: "/" },
  { source: "/index.php?", destination: "/" },

  // Pages institutionnelles (IDs SP Page Builder connus)
  { source: "/index.php?option=com_sppagebuilder&view=form&id=1", destination: "/repertoire" },
  { source: "/index.php?option=com_sppagebuilder&view=page&id=2", destination: "/qui-sommes-nous" },
  { source: "/index.php?option=com_sppagebuilder&view=page&id=3", destination: "/jema" },
];

// Fiches artisans : l'ancien site utilisait des IDs numériques.
// Le mapping exact sera complété quand MAG fournira la liste des anciennes URLs.
// En attendant, on redirige la page d'accueil Joomla vers la nouvelle racine.
export const artisanRedirects: Redirect[] = [
  // Exemple de format (à compléter) :
  // { source: "/index.php?option=com_sppagebuilder&view=page&id=630", destination: "/artisans/ap-sellerie-anne-ponthenier" },
];

export const allRedirects: Redirect[] = [...staticRedirects, ...artisanRedirects];
