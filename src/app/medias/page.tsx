import { VideoCapsule } from "@/components/ui/VideoCapsule";

export const metadata = {
  title: "Médias",
  description:
    "Capsules vidéo des métiers d'art genevois, revue de presse et articles sur les métiers d'art.",
};

type Capsule = {
  platform: "vimeo" | "youtube";
  videoId: string;
  title: string;
  category: string;
};

const capsules: Capsule[] = [
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

const externalLinks = [
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

const interviewYouTube = {
  platform: "youtube" as const,
  videoId: "una6Mnq0BBk",
  title: "Véronique Lombard, Ex-Vice-Présidente MAG",
  category: "Interview CCI Geneva",
};

const revuesPresse = [
  { year: 2026, url: "https://metiersdart-geneve.ch/images/2026/Revue%20de%20Presse%20JEMA%202026.pdf" },
  { year: 2025, url: "https://metiersdart-geneve.ch/presse/revuepresse2025.pdf" },
  { year: 2024, url: "https://metiersdart-geneve.ch/presse/revuepresse2024.pdf" },
  { year: 2023, url: "https://metiersdart-geneve.ch/presse/revuepresse2023.pdf" },
  { year: 2022, url: "https://metiersdart-geneve.ch/presse/revuepresse2022.pdf" },
];

const articlesArchives = [
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

export default function MediasPage() {
  return (
    <>
      {/* Hero */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {capsules.map((c, i) => (
              <VideoCapsule key={i} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* Interview */}
      <section className="py-12 bg-mag-sand">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-6">
            On parle des métiers d&apos;art !
          </h2>
          <p className="mb-6 text-mag-dark/70 max-w-2xl">
            Découvrez les différents médias qui mettent en lumière les savoir-faire
            et les talents des métiers d&apos;art en cliquant ci-dessous.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interview YouTube */}
            <VideoCapsule
              platform={interviewYouTube.platform}
              videoId={interviewYouTube.videoId}
              title={interviewYouTube.title}
              category={interviewYouTube.category}
            />
            {/* Liens externes */}
            <div className="space-y-4">
              {externalLinks.map((p, i) => (
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
        </div>
      </section>

      {/* Revue de presse */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-red mb-6">Revue de presse JEMA</h2>
          <div className="flex flex-wrap gap-3">
            {revuesPresse.map((r) => (
              <a
                key={r.year}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-mag-cream px-4 py-2.5 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
              >
                <i className="fas fa-file-pdf" aria-hidden />
                JEMA {r.year} (PDF)
              </a>
            ))}
          </div>

          {/* Articles archivés */}
          <h3 className="text-lg font-bold text-mag-dark mt-10 mb-4">Articles archivés</h3>
          <div className="space-y-3">
            {articlesArchives.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm hover:text-mag-red transition-colors group"
              >
                <span className="text-mag-gray font-mono whitespace-nowrap">{a.date}</span>
                <span className="text-mag-dark group-hover:text-mag-red">{a.title}</span>
                <span className="text-mag-gray text-xs italic hidden sm:inline">— {a.source}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
