export const metadata = {
  title: "L'actu des artisans",
  description:
    "Découvrez les dernières actualités de MAG et de la communauté des métiers d'art à Genève.",
};

const actualites = [
  {
    title: "Sondage Locaux",
    source: "MAG",
    category: "Sondage",
    description:
      "Enquête sur les besoins des artisan·e·s en matière de locaux d'activité. Vos réponses orienteront les futures actions de MAG.",
    linkText: "Participer au sondage",
    linkHref: "#",
  },
  {
    title: "Sondage Écoles & Artisans",
    source: "MAG",
    category: "Sondage",
    description:
      "Nouveau projet pour mettre en relation des artisan·e·s avec des classes, dans une démarche de partage de savoir-faire.",
    linkText: "Participer",
    linkHref: "#",
  },
  {
    title: "Transmission d'entreprise : sécurisez votre avenir",
    source: "FER Genève",
    category: "Événement",
    date: "25 septembre, 8h–10h30",
    description:
      "Petit déjeuner des PME et start-up : enjeux, risques, solutions concrètes pour TPE et Management Buy Out.",
    linkText: "evenements.fer-ge.ch",
    linkHref: "https://evenements.fer-ge.ch",
  },
  {
    title: "Conseil des Artisans",
    source: "MAG",
    category: "Événement",
    date: "14 octobre, 19h–20h30",
    description:
      "Groupe de travail se réunissant 4 fois/an pour échanger sur les réalités du terrain et les enjeux des métiers d'art.",
    linkText: "contact@metiersdart-geneve.ch",
    linkHref: "mailto:contact@metiersdart-geneve.ch",
  },
  {
    title: "Prix de l'Artisanat — Appel à candidature",
    source: "ACG",
    category: "Appel",
    date: "30 octobre",
    description:
      "Thème 2027 : Métiers du bois / Charpentier·ère. S'adresse aux entreprises artisanales et artisan·e·s indépendants.",
    linkText: "prix-artisanat-geneve.ch",
    linkHref: "https://prix-artisanat-geneve.ch",
  },
  {
    title: "JEMA 2027",
    source: "MAG",
    category: "Événement",
    date: "Du 19 au 21 mars 2027",
    description:
      "Réservez votre week-end pour rencontrer les professionnel·le·s des métiers d'art à Genève.",
    linkText: "En savoir plus",
    linkHref: "/jema",
  },
];

const categoryColors: Record<string, string> = {
  Sondage: "#b42c36",
  Événement: "#c9a227",
  Appel: "#4a7c59",
};

export default function ActuPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-mag-cream/60 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
            L&apos;actu des artisans
          </h1>
          <p className="mt-4 max-w-3xl text-mag-dark/70 leading-relaxed">
            Découvrez les dernières actualités de MAG et de la communauté des
            métiers d&apos;art, classées par ordre chronologique.
          </p>
        </div>
      </section>

      {/* En ce moment */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-6">En ce moment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {actualites.map((actu, i) => (
              <article
                key={i}
                className="rounded-xl border border-mag-cream p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: (categoryColors[actu.category] ?? "#999") + "20",
                      color: categoryColors[actu.category] ?? "#999",
                    }}
                  >
                    {actu.category}
                  </span>
                  {actu.date && (
                    <span className="text-xs text-mag-gray">{actu.date}</span>
                  )}
                  <span className="ml-auto text-xs text-mag-gray">par {actu.source}</span>
                </div>
                <h3 className="font-bold text-mag-dark text-lg">{actu.title}</h3>
                <p className="mt-2 text-sm text-mag-dark/70 leading-relaxed">
                  {actu.description}
                </p>
                <a
                  href={actu.linkHref}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-mag-red hover:underline"
                >
                  {actu.linkText}
                  <span aria-hidden>→</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Partager un événement */}
      <section className="py-12 bg-mag-cream/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-mag-dark mb-3">
            Vous avez un événement à partager ?
          </h2>
          <p className="text-mag-dark/60 mb-6 max-w-xl mx-auto">
            Partagez-le avec la communauté MAG via notre formulaire en ligne.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-mag-red px-6 py-3 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors"
          >
            Partager un événement
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* Archives */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-lg font-bold text-mag-dark mb-4">Archives</h2>
          <p className="text-mag-gray text-sm">
            Retrouvez les archives des événements MAG passés.
          </p>
        </div>
      </section>
    </>
  );
}
