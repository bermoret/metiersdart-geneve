import { notFound } from "next/navigation";
import Link from "next/link";
import { VideoCapsule } from "@/components/ui/VideoCapsule";

export function generateStaticParams() {
  return [
    { year: "2026" },
    { year: "2025" },
    { year: "2024" },
    { year: "2023" },
  ];
}

type EditionData = {
  year: number;
  title: string;
  dates: string;
  intro: string;
  description: string;
  video?: {
    platform: "vimeo" | "youtube";
    videoId: string;
    title: string;
  };
  programmeUrl?: string;
  stats: { label: string; value: number | string }[];
};

const editionsData: Record<string, EditionData> = {
  "2026": {
    year: 2026,
    title: "JEMA 2026",
    dates: "27-29 mars 2026",
    intro:
      "Les JEMA 2026 c'est fini... Mais elles reviennent chaque année. Démonstrations, ateliers d'initiation, conférences, visites guidées animent ce week-end dédié aux savoir-faire.",
    description:
      "Pour cette 15ᵉ édition, les métiers d'art genevois ont déployé leurs trois parcours habituels : ouverture d'ateliers dans la ville avec 15 ateliers participants, Pavillon SICLI au cœur de l'événement rassemblant 31 artisan·e·s et 6 écoles formatrices, et parcours culturel dans 12 institutions. Les visiteurs ont pu découvrir la richesse des savoir-faire locaux, du textile à l'horlogerie en passant par la sculpture sur pierre. Un week-end intense où 145 artisan·e·s genevois·e·s ont partagé leurs gestes, leurs techniques et leurs passions avec un public venu nombreux.",
    video: {
      platform: "vimeo",
      videoId: "1197627397",
      title: "Best of des JEMA 2026 par Raphaël Haab",
    },
    programmeUrl:
      "https://e.issuu.com/embed.html?d=programme_jema_2026_4a618116f09eec&u=bermoret",
    stats: [
      { label: "Artisan·e·s", value: 145 },
      { label: "Ateliers ouverts", value: 15 },
      { label: "Institutions", value: 12 },
      { label: "Écoles formatrices", value: 6 },
    ],
  },
  "2025": {
    year: 2025,
    title: "JEMA 2025",
    dates: "28-30 mars 2025",
    intro:
      "La 14ᵉ édition des JEMA a célébré le lien vivant entre les artisan·e·s et leur territoire, avec un focus particulier sur le 15ᵉ anniversaire du poinçon MAG.",
    description:
      "Pour cette 14ᵉ édition, les métiers d'art genevois ont déployé leurs trois parcours habituels : ouverture d'ateliers dans la ville, Pavillon SICLI au cœur de l'événement et parcours culturel dans les institutions. Les visiteurs ont pu découvrir la richesse des savoir-faire locaux, du textile à l'horlogerie en passant par la sculpture sur pierre. Le poinçon MAG, créé en 2010, fêtait son 15ᵉ anniversaire : l'occasion de souligner l'engagement de l'association envers les artisan·e·s genevois·e·s et la qualité de leur travail.",
    stats: [
      { label: "Artisan·e·s", value: 140 },
      { label: "Ateliers ouverts", value: 14 },
      { label: "Institutions", value: 11 },
      { label: "Écoles formatrices", value: 6 },
    ],
  },
  "2024": {
    year: 2024,
    title: "JEMA 2024",
    dates: "23-25 mars 2024",
    intro:
      "La 13ᵉ édition des Journées Européennes des Métiers d'Art a mis à l'honneur le dialogue entre tradition et innovation dans les métiers d'art genevois.",
    description:
      "Pendant un week-end, ateliers, écoles et institutions culturelles ont partagé leurs gestes, leurs techniques et leurs passions avec un public toujours plus curieux de découvrir ces métiers rares. Démonstrations, visites guidées et expositions ont ponctué ces trois jours dédiés à la transmission des savoir-faire et à la rencontre entre public et professionnel·le·s. Le focus était mis sur la transmission : comment les gestes acquis au fil des générations se transmettent aujourd'hui aux nouvelles générations d'apprenti·e·s.",
    stats: [
      { label: "Artisan·e·s", value: 135 },
      { label: "Ateliers ouverts", value: 13 },
      { label: "Institutions", value: 10 },
      { label: "Écoles formatrices", value: 5 },
    ],
  },
  "2023": {
    year: 2023,
    title: "JEMA 2023",
    dates: "24-26 mars 2023",
    intro:
      "Douzième édition consécutive pour Genève : les JEMA 2023 ont célébré le retour post-pandémie des métiers d'art en pleine lumière.",
    description:
      "Les JEMA 2023 ont marqué le retour en grand des métiers d'art genevois après les éditions perturbées par la pandémie. Démonstrations, visites guidées et expositions ont ponctué ce week-end dédié à la transmission des savoir-faire et à la rencontre entre public et professionnel·le·s. L'édition a permis de renouer le lien entre les artisan·e·s et leur public, après des années où les rencontres physiques avaient été limitées. Une célébration de la résilience et de la vitalité des métiers d'art à Genève.",
    stats: [
      { label: "Artisan·e·s", value: 120 },
      { label: "Ateliers ouverts", value: 12 },
      { label: "Institutions", value: 9 },
      { label: "Écoles formatrices", value: 5 },
    ],
  },
};

export function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  return params.then((p) => {
    const ed = editionsData[p.year];
    if (!ed) return { title: "Édition introuvable" };
    return {
      title: `${ed.title} — JEMA Genève`,
      description: ed.intro,
    };
  });
}

export default async function EditionPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const edition = editionsData[year];
  if (!edition) notFound();

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

      {/* Hero */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-mag-red font-semibold uppercase tracking-wide text-sm mb-2">
            Journées Européennes des Métiers d&apos;Art
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-mag-dark font-serif">
            {edition.title}
          </h1>
          <p className="mt-2 text-lg text-mag-gray">{edition.dates}</p>
          <p className="mt-6 text-lg text-mag-dark/70 leading-relaxed">
            {edition.intro}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {edition.stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-xl bg-mag-cream/40 p-6 text-center"
              >
                <p className="text-3xl font-black text-mag-red">{stat.value}</p>
                <p className="mt-1 text-xs text-mag-gray">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description détaillée */}
      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-mag-cream p-8 sm:p-10">
            <h2 className="text-xl font-bold text-mag-dark font-serif mb-4">
              Retour sur l&apos;édition
            </h2>
            <p className="text-mag-dark/70 leading-relaxed whitespace-pre-line">
              {edition.description}
            </p>
          </div>
        </div>
      </section>

      {/* Vidéo Best of (si disponible) */}
      {edition.video && (
        <section className="py-8">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-mag-red mb-4">
              En images
            </h2>
            <div className="max-w-2xl mx-auto">
              <VideoCapsule
                platform={edition.video.platform}
                videoId={edition.video.videoId}
                title={edition.video.title}
                category={`JEMA ${edition.year}`}
              />
            </div>
          </div>
        </section>
      )}

      {/* Programme officiel (si disponible) */}
      {edition.programmeUrl && (
        <section className="py-8">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <a
              href={edition.programmeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-mag-red px-6 py-3 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors"
            >
              <i className="fas fa-book-open" aria-hidden />
              Consulter le programme officiel
            </a>
          </div>
        </section>
      )}

      {/* Navigation vers autres éditions */}
      <section className="py-12 bg-mag-cream/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-mag-dark mb-6">Autres éditions</h2>
          <div className="flex flex-wrap gap-3">
            {Object.values(editionsData)
              .filter((e) => e.year !== edition.year)
              .map((e) => (
                <Link
                  key={e.year}
                  href={`/jema/${e.year}`}
                  className="inline-flex items-center gap-2 rounded-full border border-mag-cream px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
                >
                  JEMA {e.year}
                </Link>
              ))}
            <Link
              href="/jema"
              className="inline-flex items-center gap-2 rounded-full border border-mag-cream px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
            >
              ← Page JEMA
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
