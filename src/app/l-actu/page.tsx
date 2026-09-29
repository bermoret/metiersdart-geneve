import Image from "next/image";
import { PageHero } from "@/components/ui/Editorial";
import { getActualites } from "@/lib/db-data";
import { actuLinkLabel, formatActuDate } from "@/lib/actu-medias";
import { isExternalHref } from "@/lib/url";
import { canOptimizeImage } from "@/lib/utils";

export const metadata = {
  title: "L'actu des artisans",
  description:
    "Découvrez les dernières actualités de MAG et de la communauté des métiers d'art à Genève.",
};

// Contenu saisi dans l'admin (table actualites) : une modification est visible
// dans la minute, comme sur les autres pages publiques.
export const revalidate = 60;

/** Lien externe : nouvel onglet ; mailto et pages du site : même onglet. */
function linkProps(href: string) {
  return isExternalHref(href) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

export default async function ActuPage() {
  const actualites = await getActualites();

  return (
    <>
      <PageHero
        eyebrow={<>Actualités</>}
        title={<>L&apos;actu des artisans</>}
        lead={
          <>
            <p className="max-w-3xl text-mag-dark/80 leading-relaxed">
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
          </>
        }
      />

      {/* Cartes d'actualité */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {actualites.length === 0 && (
            <p className="text-mag-dark/70">Aucune actualité pour le moment.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {actualites.map((actu) => {
              const date = formatActuDate(actu.eventDate, actu.eventEndDate);
              const imageClass =
                "relative aspect-[4/3] overflow-hidden rounded bg-mag-cream block group/img";
              const image = actu.imageUrl && (
                <Image
                  src={actu.imageUrl}
                  alt={actu.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover/img:scale-105"
                  unoptimized={!canOptimizeImage(actu.imageUrl)}
                />
              );
              return (
                <article
                  key={actu.id}
                  className="group flex flex-col border-t-2 border-mag-dark pt-5 bg-white"
                >
                  {/* Image cliquable */}
                  {actu.linkUrl ? (
                    <a href={actu.linkUrl} {...linkProps(actu.linkUrl)} className={imageClass}>
                      {image}
                    </a>
                  ) : (
                    <div className={imageClass}>{image}</div>
                  )}

                  {/* Contenu */}
                  <div className="pt-5 flex flex-col flex-1">
                    {actu.badge && (
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#ba372a" }}>
                        {actu.badge}
                      </p>
                    )}
                    {date && (
                      <p className="text-sm">
                        <span className="font-semibold text-mag-red">{date}</span>
                        {actu.timeLabel && (
                          <span className="text-mag-gray"> {actu.timeLabel}</span>
                        )}
                      </p>
                    )}
                    <h3 className="mt-2 font-serif font-bold text-mag-dark text-2xl leading-tight">
                      {actu.title}
                    </h3>
                    {actu.subtitle && (
                      <p className="mt-1 text-xs font-medium text-mag-dark/70">
                        {actu.subtitle}
                      </p>
                    )}
                    {actu.source && (
                      <p className="mt-1 text-xs italic text-mag-gray">
                        par {actu.source}
                      </p>
                    )}
                    {actu.description && (
                      <p className="mt-3 text-sm text-mag-dark/70 leading-relaxed flex-1">
                        {actu.description}
                      </p>
                    )}
                    {actu.linkUrl && (
                      <a
                        href={actu.linkUrl}
                        {...linkProps(actu.linkUrl)}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-mag-red hover:underline self-start"
                      >
                        {actuLinkLabel(actu)}
                        <span aria-hidden>→</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
