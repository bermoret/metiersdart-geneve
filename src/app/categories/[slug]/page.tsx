import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "@/components/ui/Editorial";
import { getArtisansByCategoryDb, getArtisanCategories } from "@/lib/db-data";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { canOptimizeImage, normalizeHex } from "@/lib/utils";

// ISR : contenu rafraîchi au plus toutes les 60 s après une modification admin.
export const revalidate = 60;

export async function generateStaticParams() {
  const cats = await getArtisanCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cats = await getArtisanCategories();
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) return { title: "Catégorie introuvable" };
  const description = cat.description ?? `${cat.name} — métiers d'art à Genève`;
  return {
    title: `${cat.name} — MAG`,
    description,
    openGraph: {
      title: `${cat.name} — Métiers d'Art Genève`,
      description,
      type: "website",
    },
    alternates: {
      canonical: `/categories/${slug}`,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [cats, list] = await Promise.all([
    getArtisanCategories(),
    getArtisansByCategoryDb(slug),
  ]);

  const category = cats.find((c) => c.slug === slug);
  if (!category) notFound();

  // Autres catégories pour navigation
  const otherCats = cats.filter((c) => c.slug !== slug);

  // Couleur saisie dans l'admin, interpolée dans du CSS inline : normalisée.
  const tint = normalizeHex(category.color) ?? "#b42c36";

  // Photo d'en-tête : la première fiche du domaine qui en a une.
  const cover = list.find((a) => a.imageUrl) ?? null;

  return (
    <>
      {/* En-tête : filet à la couleur du domaine (décoratif) */}
      <div style={{ borderTop: `6px solid ${tint}` }}>
        <PageHero
          eyebrow={
            <>
              <CategoryIcon icon={category.icon ?? ""} />
              &nbsp;&nbsp;Domaine d&apos;art · {list.length} artisan·e·s
            </>
          }
          title={category.name}
          lead={category.description ? <p>{category.description}</p> : undefined}
          image={cover?.imageUrl}
          imageAlt={cover ? `${cover.name}, ${cover.craft?.toLowerCase() ?? "artisan·e"}, dans son atelier` : ""}
          caption={
            cover && (
              <p className="font-serif text-xl sm:text-2xl font-bold">
                {cover.name}
                <span className="block mt-1 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-mag-cream">
                  {[cover.craft, cover.commune].filter(Boolean).join(" · ")}
                </span>
              </p>
            )
          }
        />
      </div>

      {/* Liste des artisans */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {list.length === 0 ? (
            <p className="text-center text-mag-gray py-12">
              Aucun artisan dans ce domaine pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {list.map((artisan) => (
                <Link
                  key={artisan.id}
                  href={`/artisans/${artisan.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded bg-mag-cream">
                    {artisan.imageUrl ? (
                      <Image
                        src={artisan.imageUrl}
                        unoptimized={!canOptimizeImage(artisan.imageUrl)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-5xl text-mag-red/40" aria-hidden>
                        <CategoryIcon icon={category.icon ?? ""} />
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-mag-red">
                    {[artisan.craft?.split(" • ")[0], artisan.commune].filter(Boolean).join(" · ")}
                  </p>
                  <h2 className="mt-1.5 font-serif text-2xl font-bold leading-tight text-mag-dark group-hover:text-mag-red transition-colors">
                    {artisan.name}
                  </h2>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Navigation vers autres catégories */}
      <section className="py-16 sm:py-20 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="h-section mb-8">Autres domaines</h2>
          <div className="flex flex-wrap gap-3">
            {otherCats.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-mag-cream bg-white px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
              >
                <span aria-hidden>
                  <CategoryIcon icon={c.icon ?? ""} />
                </span> {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
