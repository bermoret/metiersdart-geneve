import Link from "next/link";
import {
  getJemaEditions,
  getArtisansOnly,
  getAllCategories,
  splitJemaEditions,
} from "@/lib/db-data";
import { formatShortRange } from "@/lib/dates";
import { PageHero } from "@/components/ui/Editorial";

export const metadata = {
  title: "JEMA — Journées Européennes des Métiers d'Art",
  description:
    "Les JEMA à Genève : rendez-vous annuel des artisanes et artisans d'art. Prochaine édition, programme, historique des éditions passées.",
};

// ISR : les éditions se rafraîchissent au plus toutes les 60 s après édition admin.
export const revalidate = 60;

// Les parcours sont du contenu éditorial stable, non géré par l'admin à ce stade.
const parcours = [
  {
    name: "Ouverture Ateliers",
    icon: "fas fa-hammer",
    description:
      "À travers la ville — 15 ateliers participants : ateliers découvertes, visites d'atelier, démonstrations.",
    stats: { ateliers: 15 },
  },
  {
    name: "Pavillon SICLI",
    icon: "fas fa-store-alt",
    description:
      "Le point central de l'événement — 31 artisan·e·s, 6 écoles formatrices, 4 ateliers d'initiation, 4 conférences, 1 salle de projection, 1 MAG Café.",
    stats: { artisans: 31, ecoles: 6, ateliers: 4, conferences: 4 },
  },
  {
    name: "Parcours Culturel",
    icon: "fas fa-university",
    description:
      "À travers la ville — 12 institutions culturelles : visites des coulisses, visites d'ateliers, expositions, démonstrations.",
    stats: { institutions: 12 },
  },
];

/** Formate une plage de dates en français : « du 19 au 21 mars 2027 ». */
function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start) return "";
  const fmtDay = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric" });
  const fmtFull = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  if (!end) return fmtFull(start);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `du ${fmtDay(start)} au ${fmtFull(end)}`;
  }
  return `du ${fmtFull(start)} au ${fmtFull(end)}`;
}

export default async function JemaPage() {
  const [allEditions, artisanList, categories] = await Promise.all([
    getJemaEditions(),
    getArtisansOnly(),
    getAllCategories(),
  ]);

  const { upcoming, past: pastEditions } = splitJemaEditions(allEditions);

  // Artisans du domaine de la pierre (section focus)
  const pierreCategory = categories.find((c) => c.name === "Art de la pierre");
  const pierreArtisans = pierreCategory
    ? artisanList.filter((a) => a.categoryName === pierreCategory.name)
    : [];

  return (
    <>
      <PageHero
        eyebrow="Journées Européennes des Métiers d'Art"
        title="JEMA"
        accent="Genève"
        lead={
          <p>
            Organisées par l&apos;Association Métiers d&apos;Art Genève (MAG), les JEMA
            représentent le rendez-vous annuel des artisanes et artisans d&apos;art à
            Genève. Céramiste, bijoutier·ère, calligraphe, ébéniste, maquettiste et
            plein d&apos;autres encore se mobilisent pour offrir au grand public un
            aperçu de leurs savoir-faire uniques et si précieux. L&apos;objectif est de
            promouvoir les métiers d&apos;art via démonstrations, animations et échanges,
            faire découvrir le patrimoine genevois et susciter des vocations.
          </p>
        }
      />

      {/* Prochaine édition — lue depuis la base (éditable dans l'admin) */}
      {upcoming && (
        <section className="focus-ring-white bg-mag-red text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 lg:gap-20 items-end">
            <div>
              <p className="text-mag-cream uppercase tracking-[0.16em] text-sm font-semibold">
                Prochaine édition
              </p>
              <h2 className="mt-5 font-black tracking-[-0.03em] leading-[0.9] text-6xl sm:text-8xl">
                {upcoming.title}
              </h2>
              {upcoming.startDate && (
                <p className="mt-6 font-serif text-2xl sm:text-3xl text-white">
                  {formatDateRange(upcoming.startDate, upcoming.endDate)}
                </p>
              )}
            </div>
            <div>
              {upcoming.description && (
                <p className="text-lg leading-relaxed text-white/90">
                  {upcoming.description}
                </p>
              )}
              {upcoming.programUrl && (
                <a
                  href={upcoming.programUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-mag-red hover:bg-mag-cream transition-colors"
                >
                  Voir le programme <span aria-hidden>→</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Parcours */}
      <section className="py-16 sm:py-24 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="h-section mb-12">
            Trois parcours proposés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {parcours.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-mag-cream bg-white p-8"
              >
                <div className="text-4xl mb-6 text-mag-red" aria-hidden>
                  <i className={p.icon} />
                </div>
                <h3 className="font-serif font-bold text-mag-dark text-2xl">{p.name}</h3>
                <p className="mt-2 text-sm text-mag-dark/70 leading-relaxed">
                  {p.description}
                </p>
                {p.stats && (
                  <dl className="mt-4 flex flex-wrap gap-4 text-xs">
                    {Object.entries(p.stats).map(([key, val]) => (
                      <div key={key} className="flex items-baseline gap-1">
                        <dt className="text-mag-gray capitalize">{key}:</dt>
                        <dd className="font-bold text-mag-red">{val}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Focus pierre */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="h-section mb-6">
              Le domaine de la pierre se mobilise
            </h2>
            <p className="text-mag-dark/70 leading-relaxed mb-4">
              Former des apprenti·e·s aujourd&apos;hui, c&apos;est préserver un patrimoine
              vivant et des compétences qui ne s&apos;apprennent qu&apos;au contact des
              artisanes et artisans. Façonner la pierre, c&apos;est transformer une matière
              brute et millénaire en éléments durables : sculptures et éléments décoratifs,
              escaliers, façades et monuments, fontaines, plans de travail et aménagement.
            </p>
            <p className="text-mag-dark/70 leading-relaxed mb-4">
              En Suisse romande, ces savoir-faire sont portés par les tailleurs et
              tailleuses de pierre, qui conjuguent gestes traditionnels, précision technique
              et outils contemporains. La formation s&apos;effectue par un apprentissage de
              quatre ans menant au CFC Tailleur de pierre / Tailleuse de pierre, avec quatre
              orientations possibles : sculpture ; conception et marbrerie ; bâtiment et
              rénovation ; industrie.
            </p>
            <div className="my-10 grid grid-cols-3 gap-6">
              <div>
                <p className="font-serif text-5xl sm:text-6xl font-black text-mag-red pt-4 border-t border-mag-red/30">24</p>
                <p className="mt-2 text-sm text-mag-gray">2017–2020</p>
              </div>
              <div>
                <p className="font-serif text-5xl sm:text-6xl font-black text-mag-red pt-4 border-t border-mag-red/30">12</p>
                <p className="mt-2 text-sm text-mag-gray">2023–2024</p>
              </div>
              <div>
                <p className="font-serif text-5xl sm:text-6xl font-black text-mag-red pt-4 border-t border-mag-red/30">15</p>
                <p className="mt-2 text-sm text-mag-gray">2025–2026</p>
              </div>
            </div>
            <p className="text-mag-dark/70 leading-relaxed italic mb-4">
              Aujourd&apos;hui pourtant, ces métiers sont fragilisés. Le nombre
              d&apos;apprenti·e·s est passé de 24 en 2017–2018 et 2019–2020 à seulement 12
              en 2023–2024. Malgré une légère reprise récente (15 apprenti·e·s en 2025–2026),
              la relève reste insuffisante. Sans nouveaux apprenti·e·s, des techniques, des
              gestes et une connaissance fine des matériaux risquent de disparaître. Et si
              le prochain tailleur ou la prochaine tailleuse de pierre, c&apos;était toi ?
            </p>

            {/* Artisans du domaine pierre — lus depuis la base */}
            {pierreArtisans.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-mag-dark mb-3">
                  Artisan·e·s présents (domaine de la pierre)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pierreArtisans.map((a) => (
                    <Link
                      key={a.id}
                      href={`/artisans/${a.slug}`}
                      className="inline-flex items-center rounded-full border border-mag-cream px-3 py-1.5 text-sm text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
                    >
                      {a.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Éditions passées — lues depuis la base (éditables dans l'admin) */}
      {pastEditions.length > 0 && (
        <section className="py-16 sm:py-24 bg-mag-sand">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="h-section mb-12">
              Éditions passées
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pastEditions.map((ed) => (
                <Link
                  key={ed.id}
                  href={`/jema/${ed.year}`}
                  className="group block rounded-2xl border border-mag-cream bg-white p-8 hover:border-mag-red/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="font-serif text-5xl font-black text-mag-red">{ed.year}</p>
                    <span className="text-xs text-mag-gray">
                      {formatShortRange(ed.startDate, ed.endDate)}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-mag-dark group-hover:text-mag-red transition-colors">
                    {ed.title}
                  </h3>
                  {ed.description && (
                    <p className="mt-2 text-sm text-mag-dark/70 leading-relaxed line-clamp-3">
                      {ed.description}
                    </p>
                  )}
                  {ed.highlight && (
                    <p className="mt-2 text-xs font-medium text-mag-red italic">
                      {ed.highlight}
                    </p>
                  )}
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-mag-red">
                    En savoir plus
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Merci partenaires */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="h-section mb-6">
            Merci à nos partenaires
          </h2>
          <p className="text-mag-dark/70 max-w-2xl mx-auto">
            Nous remercions chaleureusement nos partenaires pour leur soutien précieux
            sans lequel l&apos;événement n&apos;aurait pu avoir lieu.
          </p>
        </div>
      </section>
    </>
  );
}
