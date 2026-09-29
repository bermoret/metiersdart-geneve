import Link from "next/link";
import { getArtisansOnly } from "@/lib/db-data";
import { pickByNames } from "@/lib/utils";

/** Participant·e·s 2026 du domaine de la pierre (retour MAG du 28.09), dans cet ordre. */
const PIERRE_PARTICIPANTS_2026 = [
  "Atelier Cal'As",
  "Atelier Comte",
  "Philippe Cartan",
  "Daniel Estevez",
  "Michel Gillabert",
  "Mello & Fils SA",
];

/**
 * Focus « Le domaine de la pierre se mobilise » (JEMA 2026).
 * Composant serveur : retrouve lui-même les fiches des participant·e·s 2026
 * dans le répertoire (un nom sans fiche publiée n'est pas affiché).
 */
export async function PierreFocus() {
  const pierreArtisans = pickByNames(await getArtisansOnly(), PIERRE_PARTICIPANTS_2026);

  return (
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

          {/* Participant·e·s 2026 — fiches lues depuis la base */}
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
  );
}
