import Image from "next/image";

export const metadata = {
  title: "L'actu des artisans",
  description:
    "Découvrez les dernières actualités de MAG et de la communauté des métiers d'art à Genève.",
};

type ActuCard = {
  image: string;
  badge?: string;
  date?: string;
  time?: string;
  title: string;
  source: string;
  description: string;
  linkText: string;
  linkHref: string;
  subtitle?: string;
};

const actualites: ActuCard[] = [
  {
    image: "https://metiersdart-geneve.ch/images/2026/06/30/sondage-locaux_post-052.png",
    badge: "En ce moment",
    title: "SONDAGE LOCAUX",
    source: "Métiers d'Art Genève",
    description:
      "MAG réalise une enquête afin de mieux cerner les besoins des artisan·e·s en matière de locaux d'activité. Les résultats serviront à orienter les futures actions à mener. Participez au sondage ci-dessous.",
    linkText: "Plus d'info",
    linkHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSfLZO6jc-8Z_XP1cjMf1g87ZyPCztUqKBU0t3Axs9rM69WSkw/viewform?usp=dialog",
  },
  {
    image:
      "https://metiersdart-geneve.ch/images/2026/02/03/pexels-norma-mortenson-8456147.jpg",
    badge: "En ce moment",
    title: "SONDAGE ÉCOLES & ARTISANS",
    source: "Métiers d'Art Genève",
    description:
      "MAG lance un nouveau projet visant à mettre en relation des artisan·e·s et avec des classes, toujours dans une démarche de partage de savoir-faire. Si vous êtes intéressé·e, merci de remplir le formulaire ci-dessous.",
    linkText: "Plus d'info",
    linkHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSdRv72gXhfyU__rhqUBWLrga2OtfZiQv-_LEf_Tv7BoNmOpBQ/viewform?usp=header",
  },
  {
    image: "https://metiersdart-geneve.ch/images/2026/08/31/112060-011.png",
    date: "25 septembre",
    time: "8h-10h30",
    title: "TRANSMISSION D'ENTREPRISE : SÉCURISEZ VOTRE AVENIR",
    source: "FER Genève",
    description:
      "Ce Petit déjeuner des PME et des start-up permettra de décrypter les enjeux, de maîtriser les risques et de découvrir des solutions concrètes pour les TPE ainsi que les cas de Management Buy Out.",
    linkText: "Plus d'info",
    linkHref: "https://www.evenements.fer-ge.ch/reprise_cession_entreprise",
  },
  {
    image:
      "https://metiersdart-geneve.ch/images/2026/02/03/pexels-fauxels-3183172.jpg",
    date: "14 octobre",
    time: "19h-20h30",
    title: "CONSEIL DES ARTISANS",
    source: "Métiers d'Art Genève",
    description:
      "Ce groupe de travail, se regroupant quatre fois par an, a pour objectif d'échanger autour des réalités du terrain et des enjeux liés aux métiers d'art. Les artisan·e·s MAG souhaitant prendre part à la prochaine séance sont invités à nous contacter.",
    linkText: "Contact",
    linkHref: "mailto:contact@metiersdart-geneve.ch",
  },
  {
    image: "https://metiersdart-geneve.ch/images/2026/08/31/112060-02.png",
    date: "30 octobre",
    title: "PRIX DE L'ARTISANAT — APPEL À CANDIDATURE",
    source: "ACG",
    subtitle: "Métiers du bois — Charpentier·ère",
    description:
      "Le Prix de l'Artisanat s'adresse à toutes les entreprises artisanales ainsi qu'aux artisan·e·s indépendants identifiés comme faisant partie des métiers répondant à la définition de l'artisanat et issus d'un secteur d'activités particulier.",
    linkText: "Plus d'info",
    linkHref: "https://www.prix-artisanat-geneve.ch/prix-de-lartisanat-concours-2027",
  },
  {
    image: "https://metiersdart-geneve.ch/images/2026/03/12/jema27_carre_affiche.png",
    date: "du 19 au 21 mars 2027",
    title: "JOURNÉES EUROPÉENNES DES MÉTIERS D'ART 2027",
    source: "Métiers d'Art Genève",
    description:
      "Réservez déjà votre week-end pour venir à la rencontre des professionnelles et des professionnels des métiers d'art à Genève.",
    linkText: "Plus d'info",
    linkHref: "/jema",
  },
];

export default function ActuPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-mag-cream/60 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
            L&apos;actu des artisans
          </h1>
          <p className="mt-4 max-w-3xl text-mag-dark/70 leading-relaxed">
            En un clin d&apos;œil, découvrez les dernières actualités de MAG et de la
            communauté des métiers d&apos;art. Classées par ordre chronologique,
            elles vous offrent un accès clair, rapide et complet à tout ce qui fait
            vivre et rayonner les savoir-faire genevois.
          </p>
          <p className="mt-3 text-mag-dark/70">
            Vous souhaitez partager un événement ?{" "}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScLfgCD7roC3eqOlAqNr5cYtW0SRvLCYFyJ8LYBNl9xGwrpGQ/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mag-red underline hover:text-mag-red-dark transition-colors"
            >
              Contactez-nous
            </a>{" "}
            !
          </p>
        </div>
      </section>

      {/* Cartes d'actualité */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actualites.map((actu, i) => (
              <article
                key={i}
                className="flex flex-col rounded-xl border border-mag-cream overflow-hidden hover:shadow-md transition-shadow bg-white"
              >
                {/* Image cliquable */}
                <a
                  href={actu.linkHref}
                  target={actu.linkHref.startsWith("http") ? "_blank" : undefined}
                  rel={actu.linkHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="relative aspect-square overflow-hidden bg-mag-cream block group/img"
                >
                  <Image
                    src={actu.image}
                    alt={actu.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover/img:scale-105"
                    unoptimized
                  />
                </a>

                {/* Contenu */}
                <div className="p-5 flex flex-col flex-1">
                  {actu.badge && (
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#ba372a" }}>
                      {actu.badge}
                    </p>
                  )}
                  {actu.date && (
                    <p className="text-sm">
                      <span className="font-semibold text-mag-red">{actu.date}</span>
                      {actu.time && (
                        <span className="text-mag-gray"> {actu.time}</span>
                      )}
                    </p>
                  )}
                  <h3 className="mt-1 font-bold text-mag-dark text-sm leading-snug">
                    {actu.title}
                  </h3>
                  {actu.subtitle && (
                    <p className="mt-1 text-xs font-medium text-mag-dark/60">
                      {actu.subtitle}
                    </p>
                  )}
                  <p className="mt-1 text-xs italic text-mag-gray">
                    par {actu.source}
                  </p>
                  <p className="mt-3 text-sm text-mag-dark/70 leading-relaxed flex-1">
                    {actu.description}
                  </p>
                  <a
                    href={actu.linkHref}
                    target={actu.linkHref.startsWith("http") ? "_blank" : undefined}
                    rel={actu.linkHref.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-mag-red hover:underline self-start"
                  >
                    {actu.linkText}
                    <span aria-hidden>→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>


    </>
  );
}
