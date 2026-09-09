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
    icon: "🔨",
    description:
      "À travers la ville — 15 ateliers participants : ateliers découvertes, visites d'atelier, démonstrations.",
    stats: { ateliers: 15 },
  },
  {
    name: "Pavillon SICLI",
    icon: "🎪",
    description:
      "Le point central de l'événement — 31 artisan·e·s, 6 écoles formatrices, 4 ateliers d'initiation, 4 conférences, 1 salle de projection, 1 MAG Café.",
    stats: { artisans: 31, ecoles: 6, ateliers: 4, conferences: 4 },
  },
  {
    name: "Parcours Culturel",
    icon: "🏛️",
    description:
      "À travers la ville — 12 institutions culturelles : visites des coulisses, visites d'ateliers, expositions, démonstrations.",
    stats: { institutions: 12 },
  },
];

const pastEditions = [
  {
    year: 2026,
    title: "Best of JEMA 2026",
    description: "Retour en images sur les JEMA 2026 par Raphaël Haab (photographe).",
  },
  {
    year: 2025,
    title: "JEMA 2025",
    description: "Une édition riche en découvertes et rencontres.",
  },
  {
    year: 2024,
    title: "JEMA 2024",
    description: "Un week-end d'ouverture et de partage autour des métiers d'art.",
  },
  {
    year: 2023,
    title: "JEMA 2023",
    description: "Les métiers d'art à l'honneur dans toute la ville.",
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
              sont le rendez-vous annuel des artisanes et artisans d&apos;art à Genève :
              céramiste, bijoutier·ère, calligraphe, ébéniste, maquettiste… L&apos;objectif
              est de promouvoir les métiers d&apos;art via démonstrations, animations et
              échanges, faire découvrir le patrimoine genevois et susciter des vocations.
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
                <div className="text-4xl mb-4">{p.icon}</div>
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
              Former des apprenti·e·s, c&apos;est préserver un patrimoine vivant et des
              compétences. Façonner la pierre, c&apos;est sculpter des escaliers, façades,
              monuments, fontaines, plans de travail, aménagements. La formation mène au
              CFC Tailleur de pierre / Tailleuse de pierre avec 4 orientations :
              sculpture ; conception et marbrerie ; bâtiment et rénovation ; industrie.
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
            <p className="text-mag-dark/70 leading-relaxed italic">
              Baisse alarmante des apprenti·e·s, mais une légère reprise. La relève
              reste insuffisante. Et si le prochain tailleur ou la prochaine tailleuse
              de pierre, c&apos;était vous ?
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

      {/* Historique */}
      <section className="py-16 bg-mag-cream/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-mag-dark font-serif mb-8">
            Éditions passées
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pastEditions.map((ed) => (
              <div
                key={ed.year}
                className="rounded-xl border border-mag-cream bg-white p-6"
              >
                <p className="text-3xl font-black text-mag-red">{ed.year}</p>
                <h3 className="mt-2 font-semibold text-mag-dark">{ed.title}</h3>
                <p className="mt-2 text-sm text-mag-dark/60">{ed.description}</p>
              </div>
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
            Les JEMA n&apos;auraient pas pu avoir lieu sans le soutien précieux de nos
            partenaires institutionnels et privés.
          </p>
        </div>
      </section>
    </>
  );
}
