import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getArtisanBySlugDb,
  getArtisansByCategoryDb,
  getAllCategories,
  getPublishedArtisans,
} from "@/lib/db-data";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { PoinconBadge } from "@/components/ui/PoinconBadge";
import ArtisanMap from "@/components/map/ArtisanMapWrapper";
import { chipColors, canOptimizeImage } from "@/lib/utils";

// ISR : contenu rafraîchi au plus toutes les 60 s ; les nouvelles fiches
// créées dans l'admin sont rendues à la demande (dynamicParams par défaut).
export const revalidate = 60;

export async function generateStaticParams() {
  const list = await getPublishedArtisans();
  return list.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artisan = await getArtisanBySlugDb(slug);
  if (!artisan) return { title: "Artisan introuvable" };
  return {
    title: `${artisan.name} — MAG`,
    // `||` et non `??` : l'admin enregistre "" pour un champ laissé vide
    description: artisan.longDescription || artisan.shortDescription || undefined,
    openGraph: artisan.imageUrl
      ? { images: [{ url: artisan.imageUrl }] }
      : undefined,
    alternates: { canonical: `/artisans/${artisan.slug}` },
  };
}

export default async function ArtisanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artisan = await getArtisanBySlugDb(slug);
  if (!artisan) notFound();

  const categories = await getAllCategories();
  const category = categories.find((c) => c.name === artisan.categoryName);

  // Artisans du domaine : vide pour les catégories institutionnelles
  // (écoles, institutions…) qui n'ont pas de page /categories.
  const categoryArtisans = category
    ? await getArtisansByCategoryDb(category.slug)
    : [];
  // Même condition que la page catégorie : au moins un artisan rattaché
  const hasCategoryPage = categoryArtisans.length > 0;

  // Artisans du même domaine (bloc « artisans du même domaine » — validé en séance)
  const relatedArtisans = categoryArtisans
    .filter((a) => a.id !== artisan.id)
    .slice(0, 4);

  const coords =
    artisan.latitude != null && artisan.longitude != null
      ? { latitude: artisan.latitude, longitude: artisan.longitude }
      : null;

  const {
    address,
    website,
    video,
    phone,
    email,
    autre,
    longDescription: description,
    imageUrl: image,
    poinconType,
    poinconModalText,
    poinconModalLink,
  } = artisan;

  return (
    <>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center gap-2 text-sm text-mag-gray" aria-label="Fil d'Ariane">
          <Link href="/repertoire" className="hover:text-mag-red">
            Répertoire
          </Link>
          <span aria-hidden>/</span>
          {category && hasCategoryPage && (
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
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
            {/* Colonne principale */}
            <div className="lg:col-span-2">
              {artisan.craft && (
                <p className="mb-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.16em] text-mag-red">
                  {artisan.craft}
                </p>
              )}
              <h1 className="font-serif font-black text-mag-dark tracking-tight leading-[0.98] text-4xl sm:text-6xl">
                {artisan.name}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
                  style={chipColors(category?.color)}
                >
                  <CategoryIcon icon={category?.icon ?? ""} /> {category?.name}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-mag-cream/60 px-3 py-1 text-sm font-medium text-mag-dark/80"
                >
                  <span aria-hidden><i className="fas fa-map-marker-alt" /></span> {artisan.commune}
                </span>
                {poinconType && poinconModalText && (
                  <PoinconBadge
                    type={poinconType}
                    modalText={poinconModalText}
                    modalLink={poinconModalLink ?? undefined}
                  />
                )}
              </div>

              {/* Image principale */}
              {image && (
                <div className="mt-10 relative aspect-[4/3] w-full overflow-hidden rounded bg-mag-cream">
                  <Image
                    src={image}
                    alt={artisan.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                    priority
                    unoptimized={!canOptimizeImage(image)}
                  />
                </div>
              )}

              <div className="mt-12 space-y-10">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-mag-red mb-3">Métier</h2>
                  <p className="text-mag-dark/70 leading-relaxed">{artisan.craft}</p>
                </div>

                {description && (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-mag-red mb-3">
                      À propos
                    </h2>
                    <p className="text-mag-dark/70 leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  </div>
                )}

                {video && (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-mag-red mb-3">Capsule vidéo</h2>
                    <a
                      href={video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-mag-red hover:underline"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Regarder la capsule vidéo
                    </a>
                  </div>
                )}

                {/* Carte de localisation — masquée sans coordonnées (sinon (0,0)) */}
                {coords && (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-mag-red mb-3">Localisation</h2>
                    <ArtisanMap
                      latitude={coords.latitude}
                      longitude={coords.longitude}
                      name={artisan.name}
                      address={address ?? undefined}
                    />
                  </div>
                )}

                {autre && (
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-mag-red mb-3">Autre</h2>
                    <p className="text-mag-dark/70 leading-relaxed">{autre}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar — Coordonnées */}
            <aside className="lg:col-span-1">
              <div className="rounded-2xl bg-mag-sand border border-mag-cream p-7 sticky top-24">
                <h3 className="font-serif text-2xl font-bold text-mag-dark mb-5">Coordonnées</h3>
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
                  <div className="mt-6 rounded-xl bg-white p-4">
                    <p className="font-semibold text-mag-dark mb-3">Poinçon MAG</p>
                    <PoinconBadge
                      type={poinconType}
                      modalText={poinconModalText ?? ""}
                      modalLink={poinconModalLink ?? undefined}
                      variant="image"
                    />
                  </div>
                )}

                {artisan.jemaParticipant && (
                  <div className="mt-4 rounded-lg bg-white p-4 text-xs text-mag-dark/70">
                    <p>
                      Cet·te artisan·e a participé aux Journées Européennes des
                      Métiers d&apos;Art.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Artisans liés */}
      {relatedArtisans.length > 0 && (
        <section className="py-16 sm:py-20 bg-mag-sand">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="h-section mb-10">
              Dans le même domaine
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
              {relatedArtisans.map((a) => (
                <Link
                  key={a.id}
                  href={`/artisans/${a.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded bg-mag-cream">
                    {a.imageUrl ? (
                      <Image
                        src={a.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                        unoptimized={!canOptimizeImage(a.imageUrl)}
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-4xl text-mag-red/40" aria-hidden>
                        <CategoryIcon icon={category?.icon ?? ""} />
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-mag-red">
                    {[a.craft?.split(" • ")[0], a.commune].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold leading-tight text-mag-dark group-hover:text-mag-red transition-colors">
                    {a.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
