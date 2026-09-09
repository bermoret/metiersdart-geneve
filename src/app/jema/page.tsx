import Link from "next/link";
import { artisans } from "@/lib/data";

export const metadata = {
  title: "JEMA — Journées Européennes des Métiers d'Art",
  description:
    "Les JEMA à Genève : rendez-vous annuel des artisanes et artisans d'art. Prochaine édition, programme, historique des éditions passées.",
};

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

const editions = [
  {
    year: 2026,
    title: "JEMA 2026",
    dates: "27-29 mars 2026",
    description:
      "Un week-end intense où 145 artisan·e·s genevois·e·s ont ouvert leurs ateliers, animé le Pavillon SICLI et partagé leurs savoir-faire à travers toute la ville. Démonstrations, ateliers d'initiation, conférences et visites guidées ont attiré un public venu nombreux à la rencontre des métiers d'art.",
    highlight: "Best of en vidéo par Raphaël Haab",
  },
  {
    year: 2025,
    title: "JEMA 2025",
    dates: "28-30 mars 2025",
    description:
      "Pour cette 14ᵉ édition, les métiers d'art genevois ont déployé leurs trois parcours habituels : ouverture d'ateliers dans la ville, Pavillon SICLI au cœur de l'événement et parcours culturel dans 12 institutions. Les visiteurs ont pu découvrir la richesse des savoir-faire locaux, du textile à l'horlogerie en passant par la sculpture sur pierre.",
    highlight: "15ᵉ anniversaire du poinçon MAG",
  },
  {
    year: 2024,
    title: "JEMA 2024",
    dates: "23-25 mars 2024",
    description:
      "La 13ᵉ édition des Journées Européennes des Métiers d'Art a mis à l'honneur le dialogue entre tradition et innovation. Pendant un week-end, ateliers, écoles et institutions culturelles ont partagé leurs gestes, leurs techniques et leurs passions avec un public toujours plus curieux de découvrir ces métiers rares.",
    highlight: "Focus sur la transmission",
  },
  {
    year: 2023,
    title: "JEMA 2023",
    dates: "24-26 mars 2023",
    description:
      "Douzième édition consécutive pour Genève : les JEMA 2023 ont célébré le lien vivant entre les artisan·e·s et leur territoire. Démonstrations, visites guidées et expositions ont ponctué ce week-end dédié à la transmission des savoir-faire et à la rencontre entre public et professionnel·le·s.",
    highlight: "Retour post-pandémie",
  },
];

export default function JemaPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-mag-cream/60 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-mag-red font-semibold uppercase tracking-wide text-sm mb-2">
              Journées Européennes des Métiers d&apos;Art
            </p>
            <h1 className="text-4xl sm:text-5xl font-black text-mag-dark font-serif">
              JEMA Genève
            </h1>
            <p className="mt-6 text-lg text-mag-dark/70 leading-relaxed">
              Organisées par l&apos;Association Métiers d&apos;Art Genève (MAG), les JEMA
              représentent le rendez-vous annuel des artisanes et artisans d&apos;art à
              Genève. Céramiste, bijoutier·ère, calligraphe, ébéniste, maquettiste et
              plein d&apos;autres encore se mobilisent pour offrir au grand public un
              aperçu de leurs savoir-faire uniques et si précieux. L&apos;objectif est de
              promouvoir les métiers d&apos;art via démonstrations, animations et échanges,
              faire découvrir le patrimoine genevois et susciter des vocations.
            </p>
          </div>
        </div>
      </section>

      {/* Prochaine édition */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-mag-red text-white p-8 sm:p-12 text-center">
            <p className="text-white/80 uppercase tracking-wide text-sm font-semibold">
              Prochaine édition — 16ᵉ
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black">JEMA 2027</h2>
            <p className="mt-4 text-xl text-white/90">
              Du 19 au 21 mars 2027
            </p>
            <p className="mt-4 max-w-xl mx-auto text-white/80 leading-relaxed">
              Réservez votre week-end pour rencontrer les professionnel·le·s des
              métiers d&apos;art à Genève. Démonstrations, visites d&apos;ateliers,
              expositions et plus encore.
            </p>
          </div>
        </div>
      </section>

      {/* Parcours */}
      <section className="py-12 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-mag-dark font-serif mb-8 text-center">
            Trois parcours proposés
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {parcours.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-mag-cream bg-white p-6"
              >
                <div className="text-4xl mb-4 text-mag-red" aria-hidden>
                  <i className={p.icon} />
                </div>
                <h3 className="font-bold text-mag-dark text-lg">{p.name}</h3>
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
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-mag-cream p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-mag-dark font-serif mb-4">
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
            <div className="my-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-black text-mag-red">24</p>
                <p className="text-xs text-mag-gray">2017–2020</p>
              </div>
              <div>
                <p className="text-2xl font-black text-mag-red">12</p>
                <p className="text-xs text-mag-gray">2023–2024</p>
              </div>
              <div>
                <p className="text-2xl font-black text-mag-red">15</p>
                <p className="text-xs text-mag-gray">2025–2026</p>
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

            {/* Artisans du domaine pierre */}
            <div className="mt-8">
              <h3 className="font-semibold text-mag-dark mb-3">
                Artisan·e·s présents (domaine de la pierre)
              </h3>
              <div className="flex flex-wrap gap-2">
                {artisans
                  .filter((a) => a.categoryName === "Art de la pierre")
                  .map((a) => (
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
          </div>
        </div>
      </section>

      {/* Éditions passées */}
      <section className="py-16 bg-mag-cream/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-mag-dark font-serif mb-8">
            Éditions passées
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {editions.map((ed) => (
              <Link
                key={ed.year}
                href={`/jema/${ed.year}`}
                className="group block rounded-xl border border-mag-cream bg-white p-6 hover:border-mag-red/30 hover:shadow-md transition-all"
              >
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-3xl font-black text-mag-red">{ed.year}</p>
                  <span className="text-xs text-mag-gray">{ed.dates}</span>
                </div>
                <h3 className="font-semibold text-mag-dark group-hover:text-mag-red transition-colors">
                  {ed.title}
                </h3>
                <p className="mt-2 text-sm text-mag-dark/60 leading-relaxed line-clamp-3">
                  {ed.description}
                </p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-mag-red">
                  <i className="fas fa-arrow-right" aria-hidden />
                  {ed.highlight}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Merci partenaires */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-mag-dark mb-4">
            Merci à nos partenaires
          </h2>
          <p className="text-mag-dark/60 max-w-2xl mx-auto">
            Nous remercions chaleureusement nos partenaires pour leur soutien précieux
            sans lequel l&apos;événement n&apos;aurait pu avoir lieu.
          </p>
        </div>
      </section>
    </>
  );
}
