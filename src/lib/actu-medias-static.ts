// Contenu de /l-actu et /medias tel qu'affiché avant le branchement sur la base
// (29.09.2026) : repli des pages publiques sans DATABASE_URL (previews, tests)
// et source de vérité de scripts/sync-actu-medias.ts, qui aligne la base dessus.
//
// Les images et PDF sont sur Vercel Blob (migrés le 27.09, store yemBb8auYuh5E2PU) ;
// les deux articles archivés restent sur l'ancien site Joomla jusqu'au passage du
// script de synchronisation avec --apply, qui les copie sur Blob (à reporter ici).

import type { MediaType, PublicActu, PublicMedia } from "./actu-medias";

const BLOB = "https://yembb8auyuh5e2pu.public.blob.vercel-storage.com/migration-joomla";

/** Jour local (comme les timestamps sans fuseau relus par pg). */
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);

/** Données saisies, sans identifiant ; `staticActualites` les numérote. */
export type StaticActu = Omit<PublicActu, "id">;

export const staticActualites: StaticActu[] = [
  {
    title: "SONDAGE LOCAUX",
    badge: "En ce moment",
    source: "Métiers d'Art Genève",
    subtitle: null,
    description:
      "MAG réalise une enquête afin de mieux cerner les besoins des artisan·e·s en matière de locaux d'activité. Les résultats serviront à orienter les futures actions à mener. Participez au sondage ci-dessous.",
    eventDate: null,
    eventEndDate: null,
    timeLabel: null,
    linkUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSfLZO6jc-8Z_XP1cjMf1g87ZyPCztUqKBU0t3Axs9rM69WSkw/viewform?usp=dialog",
    linkLabel: "Plus d'info",
    imageUrl: `${BLOB}/actualites/f9a642d7-196c-4b6f-a01d-4d50ba7b202d-sondage-locaux_post-052.png`,
  },
  {
    title: "SONDAGE ÉCOLES & ARTISANS",
    badge: "En ce moment",
    source: "Métiers d'Art Genève",
    subtitle: null,
    description:
      "MAG lance un nouveau projet visant à mettre en relation des artisan·e·s et avec des classes, toujours dans une démarche de partage de savoir-faire. Si vous êtes intéressé·e, merci de remplir le formulaire ci-dessous.",
    eventDate: null,
    eventEndDate: null,
    timeLabel: null,
    linkUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdRv72gXhfyU__rhqUBWLrga2OtfZiQv-_LEf_Tv7BoNmOpBQ/viewform?usp=header",
    linkLabel: "Plus d'info",
    imageUrl: `${BLOB}/actualites/8f4efe1f-a4a6-413e-9701-8e8d0e9a35a7-pexels-norma-mortenson-8456147.jpg`,
  },
  {
    title: "CONSEIL DES ARTISANS",
    badge: null,
    source: "Métiers d'Art Genève",
    subtitle: null,
    description:
      "Ce groupe de travail, se regroupant quatre fois par an, a pour objectif d'échanger autour des réalités du terrain et des enjeux liés aux métiers d'art. Les artisan·e·s MAG souhaitant prendre part à la prochaine séance sont invités à nous contacter.",
    eventDate: day(2026, 10, 14),
    eventEndDate: null,
    timeLabel: "19h-20h30",
    linkUrl: "mailto:contact@metiersdart-geneve.ch",
    linkLabel: "Contact",
    imageUrl: `${BLOB}/actualites/aac6b243-3c26-4b6d-bd51-56680ff13d45-pexels-fauxels-3183172.jpg`,
  },
  {
    title: "PRIX DE L'ARTISANAT — APPEL À CANDIDATURE",
    badge: null,
    source: "ACG",
    subtitle: "Métiers du bois — Charpentier·ère",
    description:
      "Le Prix de l'Artisanat s'adresse à toutes les entreprises artisanales ainsi qu'aux artisan·e·s indépendants identifiés comme faisant partie des métiers répondant à la définition de l'artisanat et issus d'un secteur d'activités particulier.",
    eventDate: day(2026, 10, 30),
    eventEndDate: null,
    timeLabel: null,
    linkUrl: "https://www.prix-artisanat-geneve.ch/prix-de-lartisanat-concours-2027",
    linkLabel: "Plus d'info",
    imageUrl: `${BLOB}/actualites/20ac094e-5cae-4a0d-a519-427607d8c2cf-112060-02.png`,
  },
  {
    title: "JOURNÉES EUROPÉENNES DES MÉTIERS D'ART 2027",
    badge: null,
    source: "Métiers d'Art Genève",
    subtitle: null,
    description:
      "Réservez déjà votre week-end pour venir à la rencontre des professionnelles et des professionnels des métiers d'art à Genève.",
    eventDate: day(2027, 3, 19),
    eventEndDate: day(2027, 3, 21),
    timeLabel: null,
    linkUrl: "/jema",
    linkLabel: "Plus d'info",
    imageUrl: `${BLOB}/actualites/708e763b-8cbd-40e7-899a-56ebbae1e61d-jema27_carre_affiche.png`,
  },
];

// ─── Médias ─────────────────────────────────────────────────────

export type StaticMedia = Omit<PublicMedia, "id">;

const video = (type: MediaType, sortOrder: number, videoUrl: string, title: string, source: string): StaticMedia => ({
  title,
  type,
  videoUrl,
  externalUrl: null,
  pdfUrl: null,
  date: null,
  source,
  sortOrder,
});

const vimeo = (id: string) => `https://vimeo.com/${id}`;

/** Capsules vidéo, dans l'ordre de la page. */
const capsules: [videoId: string, title: string, domaine: string][] = [
  ["1176969466", "Feutrière", "Art du textile"],
  ["1069164153", "Encadreuse", "Art du bois"],
  ["922847757", "Abatjouriste", "Art du textile"],
  ["836072346", "Couturière", "Art du textile"],
  ["811829249", "Horloger", "Art de l'horlogerie et de la bijouterie"],
  ["771730206", "Maquettiste", "Arts appliqués"],
  ["693254660", "Calligraphe", "Arts appliqués"],
  ["693451646", "Peintre décorateur", "Arts appliqués"],
  ["525766918", "CFPC métiers du bois", "Art du bois"],
  ["528806819", "Technicienne en conservation d'art", "Culture"],
  ["1069180392", "Fabricante de compositions et décors stables et durables", "Art de la terre"],
  ["922847162", "Conservateur-restaurateur", "Culture"],
  ["836072039", "Ferblantier ornemaniste", "Art du métal"],
  ["771731031", "Tailleur de pierre", "Art de la pierre"],
  ["693258249", "Encadreur", "Art du bois"],
  ["693249504", "Sculpteur", "Art du bois"],
  ["525768091", "Relieuse", "Art du papier"],
  ["528830655", "Décoratrice et accessoiriste costumes", "Art du textile"],
  ["528222797", "Staffeur", "Art de la pierre"],
  ["1191922591", "Le domaine de la pierre se mobilise !", "Art de la pierre"],
  ["924369434", "Tisserande", "Art du textile"],
  ["813122720", "Bottier — Cordonnier", "Art du cuir"],
  ["693261908", "Émailleur", "Art de l'horlogerie-bijouterie"],
  ["525767213", "Imprimeur sur presses anciennes", "Art du papier"],
  ["525767400", "Coutelier", "Art du métal"],
  ["525768614", "Oculariste", "Art du verre"],
  ["525768375", "Graveuse taille-douce", "Art du métal"],
  ["528858305", "Fleuriste", "Art floral"],
  ["811829616", "Découpeuse papier", "Art du papier"],
  ["812729258", "Sellière", "Art du cuir"],
  ["693253266", "Charpentier", "Art du bois"],
  ["525767627", "Maroquinière", "Art du cuir"],
  ["525768830", "Maître chemisier", "Art du textile"],
  ["528807264", "Bijoutière", "Art du métal"],
  ["528858538", "Facteur de piano", "Art de la facture instrumentale"],
  ["525767799", "Typographe", "Art du papier"],
  ["528366206", "Conservatrice et restauratrice de tableaux", "Art de la conservation et de la restauration"],
];

const presse = (year: number, pdfUrl: string): StaticMedia => ({
  title: `JEMA ${year}`,
  type: "presse",
  videoUrl: null,
  externalUrl: null,
  pdfUrl,
  date: day(year, 1, 1),
  source: "JEMA",
  sortOrder: 0,
});

const archive = (date: Date, title: string, source: string, externalUrl: string): StaticMedia => ({
  title,
  type: "archive",
  videoUrl: null,
  externalUrl,
  pdfUrl: null,
  date,
  source,
  sortOrder: 0,
});

export const staticMedias: StaticMedia[] = [
  ...capsules.map(([id, title, domaine], i) => video("video", i, vimeo(id), title, domaine)),
  video(
    "interview",
    0,
    "https://www.youtube.com/watch?v=una6Mnq0BBk",
    "Véronique Lombard, Ex-Vice-Présidente MAG",
    "Interview CCI Geneva",
  ),
  {
    title: "Parlons Économie | Quel avenir pour les métiers d'art ?",
    type: "article",
    videoUrl: null,
    externalUrl: "https://carac.tv/replay/parlons-economie/5547",
    pdfUrl: null,
    date: null,
    source: "carac.tv",
    sortOrder: 0,
  },
  {
    title: "3D ECO | Métiers d'art : des savoir-faire uniques.",
    type: "article",
    videoUrl: null,
    externalUrl: "https://www.lemanbleu.ch/fr/Emissions/534473-3D-ECO.html",
    pdfUrl: null,
    date: null,
    source: "Léman Bleu",
    sortOrder: 1,
  },
  presse(2026, `${BLOB}/medias/e2149251-6b84-4475-b84a-fe4c5b025b6f-Revue-de-Presse-JEMA-2026.pdf`),
  presse(2025, `${BLOB}/medias/093ce99d-c505-4ec9-b280-225978eac462-revuepresse2025.pdf`),
  presse(2024, `${BLOB}/medias/505a988a-c04d-406b-aaf1-1d5fc09a2ff6-revuepresse2024.pdf`),
  presse(2023, `${BLOB}/medias/a764d0c6-fcf0-4260-a471-c362e1d098cc-revuepresse2023.pdf`),
  presse(2022, `${BLOB}/medias/1be5224f-8c72-4f37-ab12-853afada99d5-revuepresse2022.pdf`),
  archive(
    day(2021, 10, 14),
    "Les métiers de l'horlogerie se présentent « Autour du temps »",
    "24 heures / Tribune de Genève — Formation",
    "https://yembb8auyuh5e2pu.public.blob.vercel-storage.com/migration-joomla/medias/e5a6fc13-6595-46ea-aa64-6edd5af9e731-ADT_TDG20211014_AUTOUR_DU_TEMPS_INFO.pdf",
  ),
  archive(
    day(2021, 3, 25),
    "JEMA 2021 : l'artisanat au diapason",
    "24 heures / Tribune de Genève — Emploi",
    "https://yembb8auyuh5e2pu.public.blob.vercel-storage.com/migration-joomla/medias/0c5d13d5-f80b-4071-b835-95b128325d6f-AvenueClip.pdf",
  ),
  archive(
    day(2021, 2, 1),
    "L'artisanat d'art : la face artistique des métiers du bâtiment",
    "Journal de la Fédération Genevoise des Métiers du Bâtiment, N°40",
    "https://www.fmb-ge.ch/wp-content/uploads/2021/02/DP_40.pdf",
  ),
];
