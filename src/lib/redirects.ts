// Redirections 301 (308, `permanent: true`) de l'ancien site Joomla vers le
// nouveau site, pour la bascule DNS de metiersdart-geneve.ch.
//
// Inventaire : crawl de l'ancien site du 29.09.2026 (197 pages HTML publiques).
// Formes d'URL rencontrées :
//   - menus SEF : /lactu-des-artisans, /repertoire/art-du-cuir… ;
//   - fiches (articles com_content) : /component/content/article/<id>-<alias>?catid=2&Itemid=101,
//     plus rarement /component/content/article?id=<id>[:<alias>]&Itemid=101
//     ou /index.php?option=com_content&view=article&id=<id>[:<alias>] ;
//   - pages SP Page Builder : /index.php?option=com_sppagebuilder&view=page&id=<id>.
// Les chemins identiques sur le nouveau site (/jema, /medias, /manufacto,
// /metiers-et-formations, /qui-sommes-nous, /repertoire et les quatre
// /repertoire/<répertoire>) ne sont PAS redirigés : les redirections passent
// avant les routes et masqueraient la page (vérifié par redirects.test.ts).
//
// Next.js ne supporte pas `?` et `&` dans `source` : les paramètres de requête
// se testent avec `has` (valeur = regex ancrée). Les paramètres de la requête
// d'origine sont recopiés sur la destination (comportement de Next.js, sans
// effet sur les pages visées).
//
// ORDRE CRITIQUE : Next.js applique la PREMIÈRE règle qui correspond. Les
// règles précises (avec `has`, ou par identifiant de fiche) passent avant les
// replis (`fallbackRedirects`), qui restent en dernier dans `allRedirects`.

export type RedirectRule = {
  source: string;
  destination: string;
  has?: { type: "query"; key: string; value?: string }[];
};

// ─── Pages (menus SEF et SP Page Builder) ──────────────────────

/** Anciens domaines /repertoire/<alias> → slug de catégorie (seul l'horlogerie diffère). */
const DOMAIN_ALIASES: Record<string, string> = {
  "art-du-textile": "art-du-textile",
  "art-du-cuir": "art-du-cuir",
  "art-de-l-horlogerie-et-de-la-bijouterie": "art-de-lhorlogerie-et-de-la-bijouterie",
  "art-du-bois": "art-du-bois",
  "art-du-papier": "art-du-papier",
  "art-de-la-facture-instrumentale": "art-de-la-facture-instrumentale",
  "art-de-la-terre": "art-de-la-terre",
  "arts-appliques": "arts-appliques",
  "art-du-verre": "art-du-verre",
  "art-de-la-pierre": "art-de-la-pierre",
  "art-du-metal": "art-du-metal",
  "art-de-la-conservation-et-de-la-restauration": "art-de-la-conservation-et-de-la-restauration",
};

/**
 * Pages SP Page Builder (identifiant → destination). Seules celles liées depuis
 * l'ancien site ; les autres identifiants tombent sur le repli /index.php → /.
 */
const SPPB_PAGES: Record<number, string> = {
  476: "/jema/2026", // Retour en images : Best of des JEMA 2026 (lien de /lactu-des-artisans)
  643: "/l-actu", // Archives événements
  647: "/jema", // JEMA passées (vidéos et programmes 2022-2025)
  656: "/jema", // JEMA : parcours culturel (institutions)
  658: "/jema", // JEMA : Pavillon Sicli
  659: "/jema", // JEMA : ouverture d'ateliers
  // Poinçons MAG (ancien lien « En savoir plus » des fiches, retiré en base par
  // scripts/migrate-joomla-links.ts) : pas d'équivalent, repli sur le répertoire.
  630: "/repertoire",
};

export const staticRedirects: RedirectRule[] = [
  { source: "/lactu-des-artisans", destination: "/l-actu" },
  { source: "/repertoire/repertoire-complet", destination: "/repertoire" },
  { source: "/repertoire/artisans-par-domaine", destination: "/#domaines" },
  ...Object.entries(DOMAIN_ALIASES).map(([alias, slug]) => ({
    source: `/repertoire/${alias}`,
    destination: `/categories/${slug}`,
  })),
  ...Object.entries(SPPB_PAGES).map(([id, destination]) => ({
    source: "/index.php",
    destination,
    has: [
      { type: "query" as const, key: "view", value: "page" },
      { type: "query" as const, key: "id", value: id },
    ],
  })),
];

// ─── Fiches artisans (articles Joomla) ─────────────────────────

/**
 * Identifiant d'article Joomla → slug de la fiche sur le nouveau site.
 * Rapprochement par nom (titre de la page Joomla / nom de la fiche, sans
 * casse, accents ni ponctuation), relu à la main. Plusieurs articles peuvent
 * viser la même fiche (doublons de l'ancien site). Articles sans fiche sur le
 * nouveau site (243, 290, 291, 294, 295 : non listés sur l'ancien site) :
 * repli /repertoire ; 245 (MAG) et 306 (Domus Antiqua Helvetica) : ARTICLE_PAGES.
 */
export const JOOMLA_ARTICLES: readonly [id: number, slug: string][] = [
  [157, "atelier-matin-bleu-emmanuelle-bronzino"],
  [158, "galerie-h-valerie-hangel"],
  [159, "l-antre-peaux-chris-murner"],
  [160, "atelier-gibson-oran-gibson"],
  [162, "charles-roulin"],
  [163, "revenga-chemisiers-genevois-josefa-garcia-lozano"],
  [164, "jerome-blanc"],
  [165, "bracelets-protexo-sa"],
  [166, "la-clef-des-coeurs-daniel-fauchez"],
  [167, "cordonnerie-seror-yohan-seror"],
  [168, "atelier-leckie-anna-leckie"],
  [169, "hoffmann-art-management"],
  [170, "ingrid-schmidt-schmuck"],
  [171, "association-pour-le-patrimoine-industriel-api"],
  [172, "l-atelier-de-ceramique-annick-berclaz"],
  [173, "sellerie-kuhnen-fabienne-panelati"],
  [174, "atelier-rene-rene-sylvia-blondin"],
  [175, "catherine-schmeer-bijouterie-joaillerie"],
  [176, "marina-magnin-bucher-ninamarina"],
  [177, "atelier-abr-sarl"],
  [178, "carolina-veliz-creatrice-textile"],
  [179, "fondation-martin-bodmer"],
  [180, "peter-kammermann"],
  [181, "atelier-jms-jean-michel-staudhammer"],
  [182, "atelier-d-art-jacky-riesen"],
  [183, "loutan-cie-sa"],
  [184, "cfp-construction"],
  [185, "museum-d-histoire-naturelle"],
  [186, "luxhous-sa"],
  [187, "orth-fils-sarl"],
  [188, "mercerie-catherine-b"],
  [189, "cerutti-toitures-sa"],
  [190, "barro-cie-sa"],
  [191, "conservatoire-et-jardin-botaniques-de-geneve"],
  [192, "pianos-service-p-fuhrer"],
  [193, "atelier-galerie-igor-siebold"],
  [195, "les-insolites-nina-mathez-loic"],
  [196, "fondation-baur-musee-des-arts-d-extreme-orient"],
  [197, "cfpne-lullier"],
  [199, "atelier-genevois-de-gravure-contemporaine-aggc"],
  [200, "bibliotheque-de-geneve"],
  [201, "comedie-de-geneve"],
  [202, "grand-theatre-de-geneve"],
  [203, "musee-ariana-musee-suisse-de-la-ceramique-et-du-verre"],
  [205, "cfp-arts-ceramique-bijouterie-createur-de-vetements"],
  [206, "cfp-arts-ceramique-bijouterie-createur-de-vetements"],
  [207, "cfpt-horlogerie"],
  [208, "atelier-laurent-jolliet"],
  [209, "vaudaux-haute-gainerie-depuis-1908"],
  [210, "emmanuelle-zem-rohner"],
  [211, "maitre-luthier-francois-lebeau"],
  [212, "rehane-favereau"],
  [213, "sellerie-moto-dubouloz-simon-dubouloz"],
  [214, "atelier-de-lutherie-beatrice-de-haller"],
  [215, "la-boutique-du-relieur-michel-magnin"],
  [216, "ap-sellerie-anne-ponthenier"],
  [217, "yvan-hostettler"],
  [218, "atelier-comte"],
  [219, "atelier-cal-as-artisans-sculpteurs-vincent-du-bois"],
  [220, "roger-truan-sa"],
  [221, "atelier-c1-thierry-reverdin"],
  [222, "michel-gillabert"],
  [223, "philippe-cartan"],
  [224, "ici-ceramique-elise-naville"],
  [225, "blandenier-sa"],
  [226, "finissimo-reliure-alexis-de-los-santos"],
  [227, "marco-colucci-encadrement-art"],
  [228, "sylvio-asseo"],
  [229, "metaloid-sa"],
  [230, "l-atelier-b-belen-ferrier-et-mohamed-kahlia"],
  [231, "rehane-favereau"],
  [233, "samuel-gillioz"],
  [234, "stephane-greco"],
  [237, "bernard-bossert"],
  [238, "fanny-kopp"],
  [239, "cyril-sanglier"],
  [240, "beatrice-archinard"],
  [241, "musee-d-art-et-d-histoire"],
  [242, "theatre-de-carouge"],
  [244, "ofpc"],
  [246, "parcours-des-ateliers-carougeois-pac"],
  [247, "label-geneve"],
  [248, "ufgvv"],
  [249, "ateliers-horlogers-de-van-cleef-arpels"],
  [251, "musee-d-ethnographie-de-geneve-meg"],
  [252, "association-romande-des-metiers-de-la-bijouterie-asmebi"],
  [253, "elisa-neveceral-pantazopoulos"],
  [254, "karine-dupont"],
  [255, "lucien-walker"],
  [256, "atelier-contre-jour"],
  [260, "lachenal-sa"],
  [261, "laura-catignani"],
  [262, "traditech"],
  [264, "patrick-reymond"],
  [265, "musee-international-de-la-reforme"],
  [266, "marco-olivet"],
  [267, "de-fil-en-fil-nicole-genoud"],
  [268, "collection-des-moulages"],
  [270, "frederic-taddei"],
  [271, "mello-fils-sa"],
  [272, "art-kern"],
  [273, "atelier-9"],
  [274, "denis-schott-fille"],
  [275, "vincenti-guitares-guillaume-dayer"],
  [276, "maia-kvasnikova"],
  [277, "baxter-serigraphie"],
  [278, "atelier-du-verre-wilma-besson"],
  [279, "cyril-seiler"],
  [280, "l-atelier-de-la-cire-geneve"],
  [281, "gaspard-meier"],
  [282, "jean-philippe-naef"],
  [283, "duo-d-art"],
  [284, "la-maison-de-nathalie"],
  [285, "dorothee-loustalot"],
  [286, "poterie-passion-sylvie-cellerino"],
  [287, "joshua-teegarden"],
  [288, "heloise-ihne"],
  [289, "atelier-and-anita-durand"],
  [292, "de-fil-en-fil-nicole-genoud"],
  [293, "michel-art-michel-favre"],
  [296, "head-haute-ecole-d-art-et-de-design"],
  [297, "ateliers-de-decors-de-theatre"],
  [298, "swissart-edition-david-chojnacki"],
  [299, "jean-robert-gase"],
  [300, "olivier-murner-sa"],
  [301, "mademoiselle-l-laurence-imstepf"],
  [302, "sandy-rey"],
  [303, "sakran-sa-pascal-sakran"],
  [304, "orthethic"],
  [305, "marina-buckel"],
  [307, "julien-joselon"],
  [308, "olivier-veuthey"],
  [309, "mbg-groupement-des-metiers-techniques-du-batiment-geneve"],
  [310, "art-maison-sa"],
  [311, "ipac-design-geneve"],
  [312, "armp-association-romande-des-metiers-de-la-pierre"],
  [313, "artisan-du-staff"],
  [314, "ateliers-de-restauration-de-tableaux-laurent-jornod"],
  [315, "jardin-des-couleurs-jaky-roland"],
  [316, "atelier-orange-aline-hiltpold"],
  [317, "mioko-marie-faurax"],
  [318, "daniel-estevez"],
  [319, "scenes-du-grutli"],
  [320, "l-artisan-du-cuir-frederic-viollet"],
  [321, "ebenisterie-nikles-philippe-nikles"],
  [322, "lucas-hage"],
  [323, "bespoak-jason-lugrin"],
  [324, "rosso-encadrements"],
];

/** Articles Joomla qui ne sont pas des fiches du nouveau site. */
const ARTICLE_PAGES: readonly [id: number, destination: string][] = [
  [245, "/qui-sommes-nous"], // Métiers d'Art Genève (MAG)
  [306, "/repertoire/partenaires"], // Domus Antiqua Helvetica (partenaire de l'ancien site)
];

/**
 * Trois formes par article : /component/content/article/<id>-<alias> (l'alias
 * a pu changer : seul l'identifiant compte, comme dans Joomla),
 * /component/content/article?id=<id> et
 * /index.php?option=com_content&view=article&id=<id> (avant le repli /index.php).
 * En requête, Joomla accepte aussi `id=<id>:<alias>` : même règle
 * (regex ancrée, donc id=2160 ne correspond pas à 216).
 */
function articleRules(id: number, destination: string): RedirectRule[] {
  const idParam = { type: "query" as const, key: "id", value: `${id}(?::.*)?` };
  return [
    { source: `/component/content/article/:ref(${id}(?:-[^/]*)?)`, destination },
    { source: "/component/content/article", destination, has: [idParam] },
    {
      source: "/index.php",
      destination,
      has: [
        { type: "query", key: "option", value: "com_content" },
        { type: "query", key: "view", value: "article" },
        idParam,
      ],
    },
  ];
}

export const artisanRedirects: RedirectRule[] = [
  ...JOOMLA_ARTICLES.flatMap(([id, slug]) => articleRules(id, `/artisans/${slug}`)),
  ...ARTICLE_PAGES.flatMap(([id, destination]) => articleRules(id, destination)),
];

// ─── Replis (EN DERNIER) ───────────────────────────────────────

export const fallbackRedirects: RedirectRule[] = [
  // Tout article Joomla est une fiche du répertoire : article inconnu → répertoire.
  { source: "/component/content/article/:path*", destination: "/repertoire" },
  {
    source: "/index.php",
    destination: "/repertoire",
    has: [
      { type: "query", key: "option", value: "com_content" },
      { type: "query", key: "view", value: "article" },
    ],
  },
  // Toute autre URL /index.php (page inconnue, ancien lien) → accueil.
  { source: "/index.php", destination: "/" },
];

export const allRedirects: RedirectRule[] = [
  ...staticRedirects,
  ...artisanRedirects,
  ...fallbackRedirects,
];
