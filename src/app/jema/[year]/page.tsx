import { notFound } from "next/navigation";
import Link from "next/link";
import { VideoCapsule } from "@/components/ui/VideoCapsule";
import { videoThumbnail } from "@/lib/video-thumbnails";
import { getJemaEditions, splitJemaEditions } from "@/lib/db-data";
import { formatShortRange } from "@/lib/dates";
import { PageHero } from "@/components/ui/Editorial";
import { PierreFocus } from "@/components/jema/PierreFocus";

// ISR : les éditions se rafraîchissent au plus toutes les 60 s après édition
// admin ; une édition passée ajoutée dans l'admin est rendue à la demande.
export const revalidate = 60;

export async function generateStaticParams() {
  const { past } = splitJemaEditions(await getJemaEditions());
  return past.map((e) => ({ year: String(e.year) }));
}

/** Édition passée depuis la base (titre, dates, description, programme, stats). */
async function getPastEdition(year: string) {
  const { past } = splitJemaEditions(await getJemaEditions());
  return past.find((e) => String(e.year) === year) ?? null;
}

// Contenu éditorial complémentaire (intro, récit, vidéos, stats…), non géré
// par l'admin à ce stade. Titre, dates et programme viennent de la base : une
// édition ajoutée dans l'admin a sa page, avec sa description admin.
type EditionExtras = {
  intro?: string;
  /** Récit détaillé d'origine — prime sur la description (résumé) en base. */
  description?: string;
  /** Vidéos (Best of…), affichées côte à côte. */
  videos?: {
    platform: "vimeo" | "youtube";
    videoId: string;
    title: string;
  }[];
  /** Document du programme (issuu), ouvert dans un nouvel onglet. */
  programmeUrl?: string;
  /** Libellés propres à chaque édition. */
  stats?: { label: string; value: number }[];
  /** Section « Le domaine de la pierre se mobilise ». */
  focusPierre?: boolean;
};

const editionExtras: Record<string, EditionExtras> = {
  "2026": {
    intro:
      "Les JEMA 2026 c'est fini... Mais elles reviennent chaque année. Démonstrations, ateliers d'initiation, conférences, visites guidées animent ce week-end dédié aux savoir-faire.",
    description:
      "Pour cette 15ᵉ édition, les métiers d'art genevois ont déployé leurs trois parcours habituels : ouverture d'ateliers dans la ville avec 15 ateliers participants, Pavillon SICLI au cœur de l'événement rassemblant 31 artisan·e·s et 6 écoles formatrices, et parcours culturel dans 12 institutions. Les visiteurs ont pu découvrir la richesse des savoir-faire locaux, du textile à l'horlogerie en passant par la sculpture sur pierre. Un week-end intense où 145 artisan·e·s genevois·e·s ont partagé leurs gestes, leurs techniques et leurs passions avec un public venu nombreux.",
    videos: [
      {
        platform: "vimeo",
        videoId: "1197627397",
        title: "Best of des JEMA 2026 par Raphaël Haab",
      },
    ],
    programmeUrl: "https://issuu.com/bermoret/docs/programme_jema_2026_4a618116f09eec",
    stats: [
      { label: "Participants", value: 68 },
      { label: "Métiers", value: 36 },
      { label: "Institutions", value: 12 },
      { label: "Écoles formatrices", value: 6 },
    ],
    focusPierre: true,
  },
  "2025": {
    intro:
      "La 14ᵉ édition des JEMA a célébré le lien vivant entre les artisan·e·s et leur territoire, avec un focus particulier sur le 15ᵉ anniversaire du poinçon MAG.",
    description:
      "Pour cette 14ᵉ édition, les métiers d'art genevois ont déployé leurs trois parcours habituels : ouverture d'ateliers dans la ville, Pavillon SICLI au cœur de l'événement et parcours culturel dans les institutions. Les visiteurs ont pu découvrir la richesse des savoir-faire locaux, du textile à l'horlogerie en passant par la sculpture sur pierre. Le poinçon MAG, créé en 2010, fêtait son 15ᵉ anniversaire : l'occasion de souligner l'engagement de l'association envers les artisan·e·s genevois·e·s et la qualité de leur travail.",
    videos: [
      {
        platform: "vimeo",
        videoId: "1086757638",
        title: "JEMA 2025 - Best of, version courte",
      },
    ],
    programmeUrl: "https://issuu.com/bermoret/docs/jema25_programme",
    stats: [
      { label: "Artisan·e·s", value: 57 },
      { label: "Ateliers ouverts", value: 21 },
      { label: "Institutions", value: 6 },
      { label: "Écoles formatrices", value: 6 },
    ],
  },
  "2024": {
    intro:
      "La 13ᵉ édition des Journées Européennes des Métiers d'Art a mis à l'honneur le dialogue entre tradition et innovation dans les métiers d'art genevois.",
    description:
      "Pendant un week-end, ateliers, écoles et institutions culturelles ont partagé leurs gestes, leurs techniques et leurs passions avec un public toujours plus curieux de découvrir ces métiers rares. Démonstrations, visites guidées et expositions ont ponctué ces trois jours dédiés à la transmission des savoir-faire et à la rencontre entre public et professionnel·le·s. Le focus était mis sur la transmission : comment les gestes acquis au fil des générations se transmettent aujourd'hui aux nouvelles générations d'apprenti·e·s.",
    videos: [
      {
        platform: "vimeo",
        videoId: "954816353",
        title: "JEMA 2024 - Best of, version courte",
      },
      {
        platform: "vimeo",
        videoId: "954813918",
        title: "JEMA 2024 - Best of, le film",
      },
    ],
    programmeUrl: "https://issuu.com/bermoret/docs/programme_jema24_web",
    stats: [
      { label: "Artisan·e·s", value: 55 },
      { label: "Ateliers", value: 23 },
      { label: "Institutions", value: 8 },
      { label: "Écoles formatrices", value: 5 },
    ],
  },
  "2023": {
    intro:
      "Douzième édition consécutive pour Genève : les JEMA 2023 ont célébré le retour post-pandémie des métiers d'art en pleine lumière.",
    description:
      "Les JEMA 2023 ont marqué le retour en grand des métiers d'art genevois après les éditions perturbées par la pandémie. Démonstrations, visites guidées et expositions ont ponctué ce week-end dédié à la transmission des savoir-faire et à la rencontre entre public et professionnel·le·s. L'édition a permis de renouer le lien entre les artisan·e·s et leur public, après des années où les rencontres physiques avaient été limitées. Une célébration de la résilience et de la vitalité des métiers d'art à Genève.",
    videos: [
      {
        platform: "vimeo",
        videoId: "827192143",
        title: "JEMA 2023 - Best of, version courte",
      },
      {
        platform: "vimeo",
        videoId: "827181303",
        title: "JEMA 2023 - Best of, version longue",
      },
    ],
    programmeUrl: "https://issuu.com/bermoret/docs/progr_jema_site_final_2023-1",
    stats: [
      { label: "Artisan·e·s", value: 35 },
      { label: "Métiers", value: 29 },
      { label: "Institutions", value: 9 },
      { label: "Écoles formatrices", value: 5 },
    ],
  },
  // Pas d'intro ni de récit pour 2022 : la page s'en passe.
  "2022": {
    videos: [
      {
        platform: "vimeo",
        videoId: "719074808",
        title: "JEMA 2022 - Best of, version courte",
      },
      {
        platform: "vimeo",
        videoId: "719106210",
        title: "JEMA 2022 - Best of, le film",
      },
    ],
    programmeUrl: "https://issuu.com/bermoret/docs/mise_en_page_finale_2_0393e91b4eab4c",
    stats: [
      { label: "Artisan·e·s", value: 29 },
      { label: "Métiers", value: 27 },
      { label: "Institutions", value: 6 },
      { label: "Écoles formatrices", value: 5 },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const ed = await getPastEdition(year);
  if (!ed) return { title: "Édition introuvable" };
  return {
    title: `${ed.title} — JEMA Genève`,
    description: editionExtras[year]?.intro || ed.description || undefined,
  };
}

export default async function EditionPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const ed = await getPastEdition(year);
  if (!ed) notFound();

  const extras = editionExtras[year] ?? {};
  const allPast = splitJemaEditions(await getJemaEditions()).past;
  const edition = {
    year: ed.year,
    title: ed.title,
    dates: formatShortRange(ed.startDate, ed.endDate),
    intro: extras.intro,
    // Le récit détaillé d'origine prime tant qu'il n'est pas en base ; la
    // description admin (résumé des cartes /jema) sert aux nouvelles éditions.
    description: extras.description || ed.description,
    // Miniatures chargées côté serveur (null si Vimeo ne répond pas : placeholder).
    videos: await Promise.all(
      (extras.videos ?? []).map(async (v) => ({
        ...v,
        thumbnailUrl: await videoThumbnail(v.platform, v.videoId),
      })),
    ),
    programmeUrl: ed.programUrl || extras.programmeUrl,
    stats:
      ed.stats && Object.keys(ed.stats).length > 0
        ? Object.entries(ed.stats).map(([label, value]) => ({ label, value }))
        : (extras.stats ?? []),
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <nav
          className="flex items-center gap-2 text-sm text-mag-gray"
          aria-label="Fil d'Ariane"
        >
          <Link href="/jema" className="hover:text-mag-red">
            JEMA
          </Link>
          <span aria-hidden>/</span>
          <span className="text-mag-dark font-medium" aria-current="page">
            {edition.year}
          </span>
        </nav>
      </div>

      <PageHero
        eyebrow="Journées Européennes des Métiers d'Art"
        title={edition.title}
        lead={
          (edition.dates || edition.intro) && (
            <>
              {edition.dates && (
                <p className="font-serif text-2xl text-mag-red">{edition.dates}</p>
              )}
              {edition.intro && (
                <p className={edition.dates ? "mt-6" : undefined}>{edition.intro}</p>
              )}
            </>
          )
        }
      >
        {/* Programme officiel (si disponible) */}
        {edition.programmeUrl && (
          <a
            href={edition.programmeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-mag-red px-7 py-4 text-base font-semibold text-white hover:bg-mag-red-dark transition-colors"
          >
            <i className="fas fa-book-open" aria-hidden />
            Voir le programme
          </a>
        )}
      </PageHero>

      {/* Stats */}
      {edition.stats.length > 0 && (
        <section className="pt-16 sm:pt-20 pb-8">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
              {edition.stats.map((stat, i) => (
                <div
                  key={i}
                  className="pt-5 border-t border-mag-red/30"
                >
                  <p className="font-serif text-5xl font-black text-mag-red">{stat.value}</p>
                  <p className="mt-2 text-sm text-mag-gray">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Description détaillée */}
      {edition.description && (
        <section className="py-8">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div>
              <h2 className="h-section mb-6">
                Retour sur l&apos;édition
              </h2>
              <p className="text-mag-dark/70 leading-relaxed whitespace-pre-line">
                {edition.description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Vidéos Best of (si disponibles) : côte à côte sur grand écran */}
      {edition.videos.length > 0 && (
        <section className="py-8">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="h-section mb-8">
              En images
            </h2>
            <div
              className={
                edition.videos.length > 1
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "max-w-2xl mx-auto"
              }
            >
              {edition.videos.map((video) => (
                <VideoCapsule
                  key={video.videoId}
                  platform={video.platform}
                  videoId={video.videoId}
                  title={video.title}
                  category={`JEMA ${edition.year}`}
                  thumbnailUrl={video.thumbnailUrl}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Focus pierre (JEMA 2026) */}
      {extras.focusPierre && <PierreFocus />}

      {/* Navigation vers autres éditions */}
      <section className="py-16 sm:py-20 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="h-section mb-8">Autres éditions</h2>
          <div className="flex flex-wrap gap-3">
            {allPast
              .filter((e) => e.year !== edition.year)
              .map((e) => (
                <Link
                  key={e.year}
                  href={`/jema/${e.year}`}
                  className="inline-flex items-center gap-2 rounded-full border border-mag-cream bg-white px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
                >
                  JEMA {e.year}
                </Link>
              ))}
            <Link
              href="/jema"
              className="inline-flex items-center gap-2 rounded-full border border-mag-cream bg-white px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
            >
              ← Page JEMA
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
