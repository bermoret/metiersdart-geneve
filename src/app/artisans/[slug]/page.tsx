import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { artisans, categories, getArtisanBySlug } from "@/lib/data";
import { artisanDetails } from "@/lib/artisan-details";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { PoinconBadge } from "@/components/ui/PoinconBadge";

export function generateStaticParams() {
  return artisans.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => {
    const artisan = getArtisanBySlug(p.slug);
    if (!artisan) return { title: "Artisan introuvable" };
    const detail = artisanDetails[artisan.name];
    return {
      title: `${artisan.name} — MAG`,
      description: detail?.description ?? artisan.shortDescription,
      openGraph: detail?.image
        ? { images: [{ url: detail.image }] }
        : undefined,
    };
  });
}

export default async function ArtisanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artisan = getArtisanBySlug(slug);
  if (!artisan) notFound();

  const category = categories.find((c) => c.name === artisan.categoryName);
  const detail = artisanDetails[artisan.name];

  const relatedArtisans = artisans
    .filter(
      (a) =>
        a.categoryName === artisan.categoryName &&
        a.id !== artisan.id,
    )
    .slice(0, 4);

  // Coordonnées depuis les données scrapées
  const address = detail?.address;
  const website = detail?.website;
  const video = detail?.video;
  const phone = detail?.phone;
  const email = detail?.email;
  const autre = detail?.autre;
  const description = detail?.description;
  const image = detail?.image;
  const poinconType = detail?.poinconType;
  const poinconModalText = detail?.poinconModalText;
  const poinconModalLink = detail?.poinconModalLink;

  return (
    <>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-mag-gray" aria-label="Fil d'Ariane">
          <Link href="/repertoire" className="hover:text-mag-red">
            Répertoire
          </Link>
          <span aria-hidden>/</span>
          {category && (
            <>
              <Link
                href={`/categories/${category.slug}`}
                className="hover:text-mag-red"
              >
                {category.name}
              </Link>
              <span aria-hidden>/</span>
            </>
          )}
          <span className="text-mag-dark font-medium" aria-current="page">{artisan.name}</span>
        </nav>
      </div>

      {/* Fiche artisan */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
                {artisan.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: (category?.color ?? "#999") + "20",
                    color: category?.color ?? "#999",
                  }}
                >
                  <CategoryIcon icon={category?.icon ?? ""} /> {category?.name}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-mag-cream/60 px-3 py-1 text-sm font-medium text-mag-dark/70"
                >
                  <span aria-hidden>📍</span> {artisan.commune}
                </span>
                {poinconType && poinconModalText && (
                  <PoinconBadge
                    type={poinconType}
                    modalText={poinconModalText}
                    modalLink={poinconModalLink}
                  />
                )}
              </div>

              {/* Image principale */}
              {image && (
                <div className="mt-8 relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-mag-cream shadow-sm">
                  <Image
                    src={image}
                    alt={artisan.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div className="mt-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-mag-dark mb-2">Métier</h2>
                  <p className="text-mag-dark/70 leading-relaxed">{artisan.craft}</p>
                </div>

                {description && (
                  <div>
                    <h2 className="text-lg font-bold text-mag-dark mb-2">
                      À propos
                    </h2>
                    <p className="text-mag-dark/70 leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  </div>
                )}

                {video && (
                  <div>
                    <h2 className="text-lg font-bold text-mag-dark mb-2">Vidéo</h2>
                    <a
                      href={video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-mag-red hover:underline"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Regarder la vidéo
                    </a>
                  </div>
                )}

                {autre && (
                  <div>
                    <h2 className="text-lg font-bold text-mag-dark mb-2">Autre</h2>
                    <p className="text-mag-dark/70 leading-relaxed">{autre}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar — Coordonnées */}
            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-mag-cream p-6 sticky top-20">
                <h3 className="font-bold text-mag-dark mb-4">Coordonnées</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-mag-gray">Commune</dt>
                    <dd className="text-mag-dark font-medium">{artisan.commune}</dd>
                  </div>
                  <div>
                    <dt className="text-mag-gray">Domaine</dt>
                    <dd className="text-mag-dark font-medium">
                      {artisan.categoryName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-mag-gray">Métier</dt>
                    <dd className="text-mag-dark font-medium">{artisan.craft}</dd>
                  </div>
                  {address && (
                    <div>
                      <dt className="text-mag-gray">Adresse</dt>
                      <dd className="text-mag-dark font-medium">{address}</dd>
                    </div>
                  )}
                  {phone && (
                    <div>
                      <dt className="text-mag-gray">Téléphone</dt>
                      <dd className="text-mag-dark font-medium">
                        <a href={`tel:${phone}`} className="hover:text-mag-red transition-colors">
                          {phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {email && (
                    <div>
                      <dt className="text-mag-gray">E-mail</dt>
                      <dd className="text-mag-dark font-medium">
                        <a href={`mailto:${email}`} className="hover:text-mag-red transition-colors break-all">
                          {email}
                        </a>
                      </dd>
                    </div>
                  )}
                  {website && (
                    <div>
                      <dt className="text-mag-gray">Site internet</dt>
                      <dd className="text-mag-dark font-medium">
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-mag-red transition-colors break-all"
                        >
                          {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>

                {poinconType && (
                  <div className="mt-6 rounded-lg bg-mag-cream/40 p-4 text-sm text-mag-dark/70">
                    <p className="font-semibold text-mag-dark mb-1">
                      Poinçon MAG
                    </p>
                    <p>
                      Cet·te artisan·e détient le poinçon «&nbsp;{poinconType}&nbsp;»
                      délivré par Métiers d&apos;Art Genève.
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-lg bg-mag-sand p-4 text-xs text-mag-dark/60">
                  <p>
                    Cet·te artisan·e a participé aux Journées Européennes des
                    Métiers d&apos;Art.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Artisans liés */}
      {relatedArtisans.length > 0 && (
        <section className="py-12 bg-mag-cream/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-mag-dark mb-6">
              Autres artisan·e·s dans le même domaine
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedArtisans.map((a) => (
                <Link
                  key={a.id}
                  href={`/artisans/${a.slug}`}
                  className="group block rounded-xl border border-mag-cream bg-white p-5 hover:border-mag-red/30 hover:shadow-md transition-all"
                >
                  <p className="font-semibold text-mag-dark group-hover:text-mag-red transition-colors text-sm">
                    {a.name}
                  </p>
                  <p className="mt-1 text-xs text-mag-gray">{a.craft}</p>
                  <p className="mt-1 text-xs text-mag-gray"><span aria-hidden>📍</span> {a.commune}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
