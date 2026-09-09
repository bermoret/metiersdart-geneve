import { db } from "@/db";
import { actualites, medias } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ─── Actualités (depuis src/app/l-actu/page.tsx) ───────────────

const actuData = [
  {
    title: "SONDAGE LOCAUX",
    excerpt:
      "MAG réalise une enquête afin de mieux cerner les besoins des artisan·e·s en matière de locaux d'activité. Les résultats serviront à orienter les futures actions à mener. Participez au sondage ci-dessous.",
    category: "En ce moment",
    imageUrl: "https://metiersdart-geneve.ch/images/2026/06/30/sondage-locaux_post-052.png",
    linkUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfLZO6jc-8Z_XP1cjMf1g87ZyPCztUqKBU0t3Axs9rM69WSkw/viewform?usp=dialog",
    published: true,
  },
  {
    title: "SONDAGE ÉCOLES & ARTISANS",
    excerpt:
      "MAG lance un nouveau projet visant à mettre en relation des artisan·e·s et avec des classes, toujours dans une démarche de partage de savoir-faire. Si vous êtes intéressé·e, merci de remplir le formulaire ci-dessous.",
    category: "En ce moment",
    imageUrl: "https://metiersdart-geneve.ch/images/2026/02/03/pexels-norma-mortenson-8456147.jpg",
    linkUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdRv72gXhfyU__rhqUBWLrga2OtfZiQv-_LEf_Tv7BoNmOpBQ/viewform?usp=header",
    published: true,
  },
  {
    title: "TRANSMISSION D'ENTREPRISE : SÉCURISEZ VOTRE AVENIR",
    excerpt:
      "Ce Petit déjeuner des PME et des start-up permettra de décrypter les enjeux, de maîtriser les risques et de découvrir des solutions concrètes pour les TPE ainsi que les cas de Management Buy Out.",
    category: "FER Genève",
    imageUrl: "https://metiersdart-geneve.ch/images/2026/08/31/112060-011.png",
    linkUrl: "https://www.evenements.fer-ge.ch/reprise_cession_entreprise",
    published: true,
  },
  {
    title: "CONSEIL DES ARTISANS",
    excerpt:
      "Ce groupe de travail, se regroupant quatre fois par an, a pour objectif d'échanger autour des réalités du terrain et des enjeux liés aux métiers d'art. Les artisan·e·s MAG souhaitant prendre part à la prochaine séance sont invités à nous contacter.",
    category: "Métiers d'Art Genève",
    imageUrl: "https://metiersdart-geneve.ch/images/2026/02/03/pexels-fauxels-3183172.jpg",
    linkUrl: "mailto:contact@metiersdart-geneve.ch",
    published: true,
  },
  {
    title: "PRIX DE L'ARTISANAT — APPEL À CANDIDATURE",
    excerpt:
      "Le Prix de l'Artisanat s'adresse à toutes les entreprises artisanales ainsi qu'aux artisan·e·s indépendants identifiés comme faisant partie des métiers répondant à la définition de l'artisanat et issus d'un secteur d'activités particulier.",
    category: "ACG — Métiers du bois — Charpentier·ère",
    imageUrl: "https://metiersdart-geneve.ch/images/2026/08/31/112060-02.png",
    linkUrl: "https://www.prix-artisanat-geneve.ch/prix-de-lartisanat-concours-2027",
    published: true,
  },
  {
    title: "JOURNÉES EUROPÉENNES DES MÉTIERS D'ART 2027",
    excerpt:
      "Réservez déjà votre week-end pour venir à la rencontre des professionnelles et des professionnels des métiers d'art à Genève.",
    category: "Métiers d'Art Genève",
    imageUrl: "https://metiersdart-geneve.ch/images/2026/03/12/jema27_carre_affiche.png",
    linkUrl: "/jema",
    published: true,
  },
];

// ─── Médias (depuis src/app/medias/page.tsx) ──────────────────

const capsuleData = [
  { platform: "vimeo", videoId: "1176969466", title: "Feutrière", category: "Art du textile" },
  { platform: "vimeo", videoId: "1069164153", title: "Encadreuse", category: "Art du bois" },
  { platform: "vimeo", videoId: "922847757", title: "Abatjouriste", category: "Art du textile" },
  { platform: "vimeo", videoId: "836072346", title: "Couturière", category: "Art du textile" },
  { platform: "vimeo", videoId: "811829249", title: "Horloger", category: "Art de l'horlogerie et de la bijouterie" },
  { platform: "vimeo", videoId: "771730206", title: "Maquettiste", category: "Arts appliqués" },
  { platform: "vimeo", videoId: "693254660", title: "Calligraphe", category: "Arts appliqués" },
  { platform: "vimeo", videoId: "693451646", title: "Peintre décorateur", category: "Arts appliqués" },
  { platform: "vimeo", videoId: "525766918", title: "CFPC métiers du bois", category: "Art du bois" },
  { platform: "vimeo", videoId: "528806819", title: "Technicienne en conservation d'art", category: "Culture" },
  { platform: "vimeo", videoId: "1069180392", title: "Fabricante de compositions et décors stables et durables", category: "Art de la terre" },
  { platform: "vimeo", videoId: "922847162", title: "Conservateur-restaurateur", category: "Culture" },
  { platform: "vimeo", videoId: "836072039", title: "Ferblantier ornemaniste", category: "Art du métal" },
  { platform: "vimeo", videoId: "771731031", title: "Tailleur de pierre", category: "Art de la pierre" },
  { platform: "vimeo", videoId: "693258249", title: "Encadreur", category: "Art du bois" },
  { platform: "vimeo", videoId: "693249504", title: "Sculpteur", category: "Art du bois" },
  { platform: "vimeo", videoId: "525768091", title: "Relieuse", category: "Art du papier" },
  { platform: "vimeo", videoId: "528830655", title: "Décoratrice et accessoiriste costumes", category: "Art du textile" },
  { platform: "vimeo", videoId: "528222797", title: "Staffeur", category: "Art de la pierre" },
  { platform: "vimeo", videoId: "1191922591", title: "Le domaine de la pierre se mobilise !", category: "Art de la pierre" },
  { platform: "vimeo", videoId: "924369434", title: "Tisserande", category: "Art du textile" },
  { platform: "vimeo", videoId: "813122720", title: "Bottier — Cordonnier", category: "Art du cuir" },
  { platform: "vimeo", videoId: "693261908", title: "Émailleur", category: "Art de l'horlogerie-bijouterie" },
  { platform: "vimeo", videoId: "525767213", title: "Imprimeur sur presses anciennes", category: "Art du papier" },
  { platform: "vimeo", videoId: "525767400", title: "Coutelier", category: "Art du métal" },
  { platform: "vimeo", videoId: "525768614", title: "Oculariste", category: "Art du verre" },
  { platform: "vimeo", videoId: "525768375", title: "Graveuse taille-douce", category: "Art du métal" },
  { platform: "vimeo", videoId: "528858305", title: "Fleuriste", category: "Art floral" },
  { platform: "vimeo", videoId: "811829616", title: "Découpeuse papier", category: "Art du papier" },
  { platform: "vimeo", videoId: "812729258", title: "Sellière", category: "Art du cuir" },
  { platform: "vimeo", videoId: "693253266", title: "Charpentier", category: "Art du bois" },
  { platform: "vimeo", videoId: "525767627", title: "Maroquinière", category: "Art du cuir" },
  { platform: "vimeo", videoId: "525768830", title: "Maître chemisier", category: "Art du textile" },
  { platform: "vimeo", videoId: "528807264", title: "Bijoutière", category: "Art du métal" },
  { platform: "vimeo", videoId: "528858538", title: "Facteur de piano", category: "Art de la facture instrumentale" },
  { platform: "vimeo", videoId: "525767799", title: "Typographe", category: "Art du papier" },
  { platform: "vimeo", videoId: "528366206", title: "Conservatrice et restauratrice de tableaux", category: "Art de la conservation et de la restauration" },
];

const externalLinksData = [
  {
    title: "Parlons Économie | Quel avenir pour les métiers d'art ?",
    source: "carac.tv",
    url: "https://carac.tv/replay/parlons-economie/5547",
  },
  {
    title: "3D ECO | Métiers d'art : des savoir-faire uniques.",
    source: "Léman Bleu",
    url: "https://www.lemanbleu.ch/fr/Emissions/534473-3D-ECO.html",
  },
];

const revuesPresseData = [
  { year: 2026, url: "https://metiersdart-geneve.ch/images/2026/Revue%20de%20Presse%20JEMA%202026.pdf" },
  { year: 2025, url: "https://metiersdart-geneve.ch/presse/revuepresse2025.pdf" },
  { year: 2024, url: "https://metiersdart-geneve.ch/presse/revuepresse2024.pdf" },
  { year: 2023, url: "https://metiersdart-geneve.ch/presse/revuepresse2023.pdf" },
  { year: 2022, url: "https://metiersdart-geneve.ch/presse/revuepresse2022.pdf" },
];

const articlesArchivesData = [
  {
    date: "14.10.2021",
    title: "Les métiers de l'horlogerie se présentent « Autour du temps »",
    source: "24 heures / Tribune de Genève — Formation",
    url: "https://metiersdart-geneve.ch/presse/ADT_TDG20211014_AUTOUR_DU_TEMPS_INFO.pdf",
  },
  {
    date: "25.03.2021",
    title: "JEMA 2021 : l'artisanat au diapason",
    source: "24 heures / Tribune de Genève — Emploi",
    url: "https://metiersdart-geneve.ch/presse/AvenueClip.pdf",
  },
  {
    date: "01.02.2021",
    title: "L'artisanat d'art : la face artistique des métiers du bâtiment",
    source: "Journal de la Fédération Genevoise des Métiers du Bâtiment, N°40",
    url: "https://www.fmb-ge.ch/wp-content/uploads/2021/02/DP_40.pdf",
  },
];

async function main() {
  console.log("🌱 Seed actualités & médias…");

  await db.transaction(async (tx) => {
    // ── Actualités (idempotent: skip si titre existe déjà) ──
    let actuInserted = 0;
    for (const a of actuData) {
      const existing = await tx
        .select({ id: actualites.id })
        .from(actualites)
        .where(eq(actualites.title, a.title))
        .limit(1);
      if (existing.length > 0) continue;

      await tx.insert(actualites).values({
        title: a.title,
        excerpt: a.excerpt,
        content: a.excerpt,
        category: a.category,
        imageUrl: a.imageUrl,
        linkUrl: a.linkUrl,
        published: true,
      });
      actuInserted++;
    }
    console.log(`✓ ${actuInserted}/${actuData.length} actualités insérées`);

    // ── Médias (idempotent: skip si titre + type existent déjà) ──
    let mediaInserted = 0;
    let order = 0;

    // Capsules vidéo
    for (const c of capsuleData) {
      const videoUrl =
        c.platform === "vimeo"
          ? `https://vimeo.com/${c.videoId}`
          : `https://www.youtube.com/watch?v=${c.videoId}`;
      const existing = await tx
        .select({ id: medias.id })
        .from(medias)
        .where(and(eq(medias.title, c.title), eq(medias.type, "video")))
        .limit(1);
      if (existing.length > 0) continue;

      await tx.insert(medias).values({
        title: c.title,
        type: "video",
        mediaType: c.platform,
        videoUrl,
        source: c.category,
        sortOrder: order++,
      });
      mediaInserted++;
    }

    // Interview YouTube
    const interviewTitle = "Véronique Lombard, Ex-Vice-Présidente MAG";
    const existingInterview = await tx
      .select({ id: medias.id })
      .from(medias)
      .where(eq(medias.title, interviewTitle))
      .limit(1);
    if (existingInterview.length === 0) {
      await tx.insert(medias).values({
        title: interviewTitle,
        type: "video",
        mediaType: "youtube",
        videoUrl: "https://www.youtube.com/watch?v=una6Mnq0BBk",
        source: "Interview CCI Geneva",
        sortOrder: order++,
      });
      mediaInserted++;
    }

    // Liens externes / articles
    for (const e of externalLinksData) {
      const existing = await tx
        .select({ id: medias.id })
        .from(medias)
        .where(eq(medias.externalUrl, e.url))
        .limit(1);
      if (existing.length > 0) continue;

      await tx.insert(medias).values({
        title: e.title,
        type: "article",
        externalUrl: e.url,
        source: e.source,
        sortOrder: order++,
      });
      mediaInserted++;
    }

    // Revues de presse
    for (const r of revuesPresseData) {
      const existing = await tx
        .select({ id: medias.id })
        .from(medias)
        .where(eq(medias.pdfUrl, r.url))
        .limit(1);
      if (existing.length > 0) continue;

      await tx.insert(medias).values({
        title: `Revue de presse JEMA ${r.year}`,
        type: "presse",
        pdfUrl: r.url,
        date: new Date(`${r.year}-01-01`),
        source: "JEMA",
        sortOrder: order++,
      });
      mediaInserted++;
    }

    // Articles archivés
    for (const a of articlesArchivesData) {
      const [dd, mm, yyyy] = a.date.split(".");
      const existing = await tx
        .select({ id: medias.id })
        .from(medias)
        .where(eq(medias.externalUrl, a.url))
        .limit(1);
      if (existing.length > 0) continue;

      await tx.insert(medias).values({
        title: a.title,
        type: "article",
        externalUrl: a.url,
        source: a.source,
        date: new Date(`${yyyy}-${mm}-${dd}`),
        sortOrder: order++,
      });
      mediaInserted++;
    }

    console.log(`✓ ${mediaInserted} médias insérés (sur ${capsuleData.length + 1 + externalLinksData.length + revuesPresseData.length + articlesArchivesData.length} attendus)`);
  });

  console.log("🎉 Seed terminé !");
}

main().catch((err) => {
  console.error("❌ Erreur seed:", err);
  process.exit(1);
});
