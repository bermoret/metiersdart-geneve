import { VideoCapsule } from "@/components/ui/VideoCapsule";
import { PageHero } from "@/components/ui/Editorial";
import { videoThumbnail } from "@/lib/video-thumbnails";
import { getMedias } from "@/lib/db-data";
import { formatArchiveDate, groupMedias } from "@/lib/actu-medias";

export const metadata = {
  title: "Médias",
  description:
    "Capsules vidéo des métiers d'art genevois, revue de presse et articles sur les métiers d'art.",
};

// Contenu saisi dans l'admin (table medias) : une modification est visible dans
// la minute, comme sur les autres pages publiques. Les miniatures Vimeo
// (oEmbed) restent en cache 24 h ; une miniature manquée (délai, 429) est
// retentée à la régénération suivante.
export const revalidate = 60;

export default async function MediasPage() {
  const { capsules, interviews, links, presse, archives } = groupMedias(await getMedias());

  // Miniatures en parallèle (oEmbed Vimeo mis en cache 24 h) ; null → affiche par défaut
  const [capsuleThumbs, interviewThumbs] = await Promise.all([
    Promise.all(capsules.map((c) => videoThumbnail(c.platform, c.videoId))),
    Promise.all(interviews.map((c) => videoThumbnail(c.platform, c.videoId))),
  ]);

  return (
    <>
      <PageHero
        eyebrow={<>Vidéos et presse</>}
        title={<>Médias</>}
        lead={
          <>
            <p className="max-w-3xl text-mag-dark/80 leading-relaxed">
            Capsules vidéo, revue de presse et articles sur les métiers d&apos;art
            genevois.
          </p>
          </>
        }
      />

      {/* Capsules vidéo (section masquée si vide, comme les archives) */}
      {capsules.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="h-section mb-10">
              {capsules.length} Capsules vidéo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {capsules.map((c, i) => (
                <VideoCapsule
                  key={c.id}
                  platform={c.platform}
                  videoId={c.videoId}
                  title={c.title}
                  category={c.source ?? ""}
                  thumbnailUrl={capsuleThumbs[i]}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Interview */}
      {(interviews.length > 0 || links.length > 0) && (
        <section className="py-16 sm:py-24 bg-mag-sand">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="h-section mb-10">
              On parle des métiers d&apos;art !
            </h2>
            <p className="mb-6 text-mag-dark/70 max-w-2xl">
              Découvrez les différents médias qui mettent en lumière les savoir-faire
              et les talents des métiers d&apos;art en cliquant ci-dessous.
            </p>
            {/* Même grille que les capsules : l'interview a la même carte, à la même taille */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
              {/* Vidéos (interview YouTube…) */}
              {interviews.map((c, i) => (
                <VideoCapsule
                  key={c.id}
                  platform={c.platform}
                  videoId={c.videoId}
                  title={c.title}
                  category={c.source ?? ""}
                  thumbnailUrl={interviewThumbs[i]}
                />
              ))}
              {/* Liens externes */}
              {links.length > 0 && (
                <div className="space-y-4 lg:col-span-2 xl:col-span-3">
                  {links.map((p) => (
                    <a
                      key={p.id}
                      href={p.externalUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-mag-cream bg-white p-5 hover:border-mag-red/30 hover:shadow-sm transition-all"
                    >
                      <p className="font-semibold text-mag-dark">{p.title}</p>
                      {p.source && <p className="mt-1 text-sm text-mag-gray">{p.source}</p>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Revue de presse */}
      {(presse.length > 0 || archives.length > 0) && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {presse.length > 0 && (
              <>
                <h2 className="h-section mb-10">Revue de presse JEMA</h2>
                <div className="flex flex-wrap gap-3">
                  {presse.map((r) => (
                    <a
                      key={r.id}
                      href={r.pdfUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-mag-cream px-4 py-2.5 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
                    >
                      <i className="fas fa-file-pdf" aria-hidden />
                      {r.title} (PDF)
                    </a>
                  ))}
                </div>
              </>
            )}

            {/* Articles archivés */}
            {archives.length > 0 && (
              <>
                <h3 className={`text-lg font-bold text-mag-dark mb-4${presse.length > 0 ? " mt-10" : ""}`}>Articles archivés</h3>
                <div className="space-y-3">
                  {archives.map((a) => (
                    <a
                      key={a.id}
                      href={a.externalUrl ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm hover:text-mag-red transition-colors group"
                    >
                      {a.date && (
                        <span className="text-mag-gray font-mono whitespace-nowrap">{formatArchiveDate(a.date)}</span>
                      )}
                      <span className="text-mag-dark group-hover:text-mag-red">{a.title}</span>
                      {a.source && (
                        <span className="text-mag-gray text-xs italic hidden sm:inline">— {a.source}</span>
                      )}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
