export const metadata = {
  title: "Médias",
  description:
    "Capsules vidéo des métiers d'art genevois, revue de presse et articles sur les métiers d'art.",
};

const capsules = [
  { title: "Feutrière", category: "Art du textile" },
  { title: "Abatjouriste", category: "Art du textile" },
  { title: "Couturière", category: "Art du textile" },
  { title: "Tisserande", category: "Art du textile" },
  { title: "Décoratrice et accessoiriste costumes", category: "Art du textile" },
  { title: "Maître chemisier", category: "Art du textile" },
  { title: "Encadreuse", category: "Art du bois" },
  { title: "Encadreur", category: "Art du bois" },
  { title: "Sculpteur sur bois", category: "Art du bois" },
  { title: "CFPC métiers du bois", category: "Art du bois" },
  { title: "Charpentier", category: "Art du bois" },
  { title: "Horloger", category: "Art de l'horlogerie et de la bijouterie" },
  { title: "Émailleur", category: "Art de l'horlogerie et de la bijouterie" },
  { title: "Bijoutière", category: "Art de l'horlogerie et de la bijouterie" },
  { title: "Maquettiste", category: "Arts appliqués" },
  { title: "Calligraphe", category: "Arts appliqués" },
  { title: "Peintre décorateur", category: "Arts appliqués" },
  { title: "Technicienne en conservation d'art", category: "Conservation" },
  { title: "Conservateur-restaurateur", category: "Conservation" },
  { title: "Conservatrice et restauratrice de tableaux", category: "Conservation" },
  { title: "Fabricante de compositions et décors végétaux stables et durables", category: "Art de la terre" },
  { title: "Ferblantier ornemaniste", category: "Art du métal" },
  { title: "Coutelier", category: "Art du métal" },
  { title: "Graveuse taille-douce", category: "Art du métal" },
  { title: "Tailleur de pierre", category: "Art de la pierre" },
  { title: "Staffeur", category: "Art de la pierre" },
  { title: "Le domaine de la pierre se mobilise !", category: "Art de la pierre" },
  { title: "Relieuse", category: "Art du papier" },
  { title: "Imprimeur sur presses anciennes", category: "Art du papier" },
  { title: "Découpeuse papier", category: "Art du papier" },
  { title: "Typographe", category: "Art du papier" },
  { title: "Bottier — Cordonnier", category: "Art du cuir" },
  { title: "Sellière", category: "Art du cuir" },
  { title: "Maroquinière", category: "Art du cuir" },
  { title: "Oculariste", category: "Art du verre" },
  { title: "Fleuriste", category: "Art floral" },
  { title: "Facteur de piano", category: "Art de la facture instrumentale" },
];

const presseExterne = [
  {
    title: "Quel avenir pour les métiers d'art ?",
    source: "Parlons Économie (carac.tv)",
    url: "#",
  },
  {
    title: "Métiers d'art : des savoir-faire uniques",
    source: "3D ECO (Léman Bleu)",
    url: "#",
  },
];

const revuesPresse = [2026, 2025, 2024, 2023, 2022];

const articlesArchives = [
  {
    date: "14.10.2021",
    title: "Les métiers de l'horlogerie se présentent « Autour du temps »",
    source: "24 heures / Tribune de Genève — Formation",
  },
  {
    date: "25.03.2021",
    title: "JEMA 2021 : l'artisanat au diapason",
    source: "24 heures / Tribune de Genève — Emploi",
  },
  {
    date: "01.02.2021",
    title: "L'artisanat d'art : la face artistique des métiers du bâtiment",
    source: "Journal de la Fédération Genevoise des Métiers du Bâtiment, N°40",
  },
];

export default function MediasPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-mag-cream/60 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
            Médias
          </h1>
          <p className="mt-4 max-w-3xl text-mag-dark/70 leading-relaxed">
            Capsules vidéo, revue de presse et articles sur les métiers d&apos;art
            genevois.
          </p>
        </div>
      </section>

      {/* Capsules vidéo */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-6">
            Capsules vidéo ({capsules.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {capsules.map((c, i) => (
              <div
                key={i}
                className="group rounded-xl border border-mag-cream overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-mag-dark flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-mag-red/20 to-mag-dark/40" />
                  <svg
                    className="relative z-10 w-12 h-12 text-white/80 group-hover:text-white transition-colors"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="p-4">
                  <p className="font-medium text-sm text-mag-dark">{c.title}</p>
                  <p className="mt-1 text-xs text-mag-gray">{c.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* On parle des métiers d'art */}
      <section className="py-12 bg-mag-sand">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-6">
            On parle des métiers d&apos;art !
          </h2>
          <div className="space-y-4">
            {presseExterne.map((p, i) => (
              <a
                key={i}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-mag-cream bg-white p-5 hover:border-mag-red/30 hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-mag-dark">{p.title}</p>
                <p className="mt-1 text-sm text-mag-gray">{p.source}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Revue de presse */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-6">Revue de presse JEMA</h2>
          <div className="flex flex-wrap gap-3">
            {revuesPresse.map((year) => (
              <a
                key={year}
                href="#"
                className="inline-flex items-center gap-2 rounded-lg border border-mag-cream px-4 py-2.5 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                JEMA {year} (PDF)
              </a>
            ))}
          </div>

          {/* Articles archivés */}
          <h3 className="text-lg font-bold text-mag-dark mt-10 mb-4">Articles archivés</h3>
          <div className="space-y-3">
            {articlesArchives.map((a, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                <span className="text-mag-gray font-mono whitespace-nowrap">{a.date}</span>
                <span className="text-mag-dark">{a.title}</span>
                <span className="text-mag-gray text-xs italic">— {a.source}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
