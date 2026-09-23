import { getArtisansOnly, getCommunesForMap } from "@/lib/db-data";
import { communeKey } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { CommunesMapSection } from "@/components/qui-sommes-nous/CommunesMapSection";
import { PageHero } from "@/components/ui/Editorial";

export const metadata = {
  title: "Qui sommes-nous",
  description:
    "MAG est une association tripartite apolitique, sans but lucratif, à l'interface de l'artisanat, de la culture, du patrimoine et de l'art.",
};

// ISR : la carte des communes (partenaires, artisan·e·s) suit les modifications de l'admin.
export const revalidate = 60;

const valeurs = [
  {
    title: "Ouverture",
    description:
      "Le dialogue, la réflexion, l'innovation et l'adaptation aux parties prenantes sont au cœur de notre démarche.",
  },
  {
    title: "Respect",
    description:
      "Travail de qualité, développement durable et intérêt général guident nos actions au quotidien.",
  },
  {
    title: "Authenticité",
    description:
      "Crédibilité par des actions concrètes, pertinentes, dans un souci d'équilibre, d'équité et de pérennité.",
  },
];

const comite = [
  { name: "Nicolas Rufener", role: "Président", representation: "UAPG" },
  { name: "Liliane Zossou", role: "Vice-Présidente", representation: "État de Genève — DIP" },
  { name: "Andreas Frutiger", role: "Trésorier", representation: "CGAS" },
  { name: "Juliette Zurmühle", role: "Membre", representation: "État de Genève — DEE" },
  { name: "Catherine Lance", role: "Membre", representation: "FER" },
  { name: "Cosima Trabichet-Castan", role: "Membre", representation: "DOMUS Genève" },
  { name: "Chris Murner", role: "Membre", representation: "Parcours des Ateliers Carougeois" },
];

const partenaires = [
  {
    name: "UFGVV",
    full: "Union des fabricants d'horlogerie de Genève, Vaud et Valais",
    description:
      "Représente plus d'un quart des effectifs de la Convention Patronale de l'industrie horlogère. Soutient MAG dans la promotion, communication et transmission des savoir-faire.",
    website: "ufgvv.ch",
  },
  {
    name: "OPS",
    full: "Office du patrimoine et des sites",
    description:
      "Sauvegarde du patrimoine, conseil technique, restauration. Organise les JEP, JEMA et « l'Art de Bâtir ».",
    website: "ge.ch",
    url: "https://www.ge.ch/organisation/office-du-patrimoine-sites-ops",
  },
  {
    name: "OFPC",
    full: "Office pour l'orientation, la formation professionnelle et continue",
    description:
      "Encadrement de la filière professionnelle genevoise, promotion de l'apprentissage. Met en lumière les métiers d'art via JEMA et cité-métiers.ch.",
    website: "ge.ch",
    url: "https://www.ge.ch/organisation/direction-generale-office-orientation-formation-professionnelle-continue",
  },
  {
    name: "Domus Antiqua Helvetica (DAH)",
    full: "",
    description:
      "Sauvegarde et valorisation des demeures historiques. Plus de 1600 membres propriétaires de demeures dignes de protection. Fondée en 1984.",
    website: "domusgeneve.com",
  },
];

const secrétariat = [
  "Elsa Monteiro",
  "Serena Marano",
  "Sandra Torres Loyola",
  "Steeves Emmenegger",
];

export default async function QuiSommesNousPage() {
  const [communes, artisansOnly] = await Promise.all([getCommunesForMap(), getArtisansOnly()]);
  // Une commune partenaire sans artisan·e au répertoire est « en recherche d'artisan·e·s ».
  const withArtisans = new Set(artisansOnly.map((a) => communeKey(a.commune ?? "")));
  const mapCommunes = communes.map((c) => ({ ...c, hasArtisans: withArtisans.has(communeKey(c.name)) }));
  return (
    <>
      <PageHero
        eyebrow={<>L&apos;association · Mission</>}
        title={<>Qui sommes-nous</>}
        image="/artisan-hands.jpg"
        imageAlt="Mains d'artisan travaillant le bois dans son atelier"
        lead={
          <p>
            MAG est une association tripartite apolitique, sans but lucratif.
            Elle se situe à l&apos;interface de l&apos;artisanat, de la culture,
            du patrimoine et de l&apos;art. MAG fédère, promeut, représente et
            défend les métiers d&apos;art et les artisan·e·s qui les exercent,
            au niveau local et régional. Elle favorise la pérennité et la
            transmission des savoir-faire.
          </p>
        }
      />

      {/* Valeurs */}
      <section className="py-16 sm:py-24 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="h-section mb-12">Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {valeurs.map((v, i) => (
              <div key={v.title} className="pt-6 border-t border-mag-red/30">
                <span className="font-serif text-lg font-bold text-mag-red">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 mb-3 font-serif font-bold text-mag-dark text-3xl">{v.title}</h3>
                <p className="text-mag-dark/70 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comité */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="h-section mb-8">Comité</h2>
          <p className="text-sm text-mag-gray mb-6">au 04.06.25</p>
          <div className="overflow-x-auto rounded-xl border border-mag-cream shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-mag-cream/50 text-mag-dark/80">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Rôle</th>
                  <th className="px-4 py-3 font-semibold">Représentation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mag-cream/60">
                {comite.map((m) => (
                  <tr key={m.name} className="hover:bg-mag-cream/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-mag-dark">{m.name}</td>
                    <td className="px-4 py-3 text-mag-dark/70">{m.role}</td>
                    <td className="px-4 py-3 text-mag-dark/70">{m.representation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Secrétariat */}
          <div className="mt-8 rounded-xl bg-mag-cream/30 p-6">
            <h3 className="font-bold text-mag-dark mb-2">Secrétariat général</h3>
            <p className="text-sm text-mag-dark/70 mb-3">
              Assuré par <strong>emmenegger compétences conseils</strong>.
            </p>
            <div className="flex flex-wrap gap-2">
              {secrétariat.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-mag-dark/80"
                >
                  {name}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-mag-gray">
              Contact :{" "}
              <a href="mailto:contact@metiersdart-geneve.ch" className="text-mag-red hover:underline">
                contact@metiersdart-geneve.ch
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Communes partenaires */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="h-section mb-8">
              Communes partenaires
            </h2>
            <p className="text-mag-dark/70 leading-relaxed mb-6 max-w-3xl">
              MAG travaille en étroite collaboration avec les communes du canton de Genève.
              Les communes partenaires soutiennent l&apos;association et contribuent à la
              promotion des métiers d&apos;art sur leur territoire. La carte indique aussi les
              communes où exercent des artisan·e·s du répertoire.
            </p>
          </Reveal>

          <CommunesMapSection communes={mapCommunes} />
        </div>
      </section>

      {/* Partenaires */}
      <section className="py-16 sm:py-24 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="h-section mb-12">Partenaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {partenaires.map((p) => (
              <div key={p.name} className="rounded-xl border border-mag-cream bg-white p-6">
                <h3 className="font-bold text-mag-dark">{p.name}</h3>
                {p.full && (
                  <p className="mt-1 text-sm text-mag-gray">{p.full}</p>
                )}
                <p className="mt-3 text-sm text-mag-dark/70 leading-relaxed">
                  {p.description}
                </p>
                <p className="mt-3 text-xs">
                  <a
                    href={p.url ?? `https://${p.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mag-red hover:underline"
                  >
                    {p.website}
                  </a>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
