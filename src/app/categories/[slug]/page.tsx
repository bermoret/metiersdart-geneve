import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, getArtisansByCategory } from "@/lib/data";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then((p) => {
    const cat = categories.find((c) => c.slug === p.slug);
    return {
      title: cat ? `${cat.name} — MAG` : "Catégorie introuvable",
      description: cat?.description,
    };
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const list = getArtisansByCategory(slug);

  // Autres catégories pour navigation
  const otherCats = categories.filter(
    (c) => c.slug !== slug && c.slug !== "partenaires",
  );

  return (
    <>
      {/* Header */}
      <section
        className="py-16"
        style={{
          background: `linear-gradient(135deg, ${category.color}15, ${category.color}05)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{category.icon}</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
                {category.name}
              </h1>
              <p className="mt-2 text-mag-dark/60">{list.length} artisan·e·s</p>
            </div>
          </div>
          {category.description && (
            <p className="max-w-2xl text-lg text-mag-dark/70 leading-relaxed mt-4">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* Liste des artisans */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {list.length === 0 ? (
            <p className="text-center text-mag-gray py-12">
              Aucun artisan dans ce domaine pour le moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((artisan) => (
                <Link
                  key={artisan.id}
                  href={`/artisans/${artisan.slug}`}
                  className="group block rounded-xl border border-mag-cream p-6 hover:border-mag-red/30 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-mag-dark group-hover:text-mag-red transition-colors">
                    {artisan.name}
                  </h3>
                  <p className="mt-2 text-sm text-mag-dark/70">{artisan.craft}</p>
                  <p className="mt-1 text-xs text-mag-gray flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {artisan.commune}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Navigation vers autres catégories */}
      <section className="py-12 bg-mag-cream/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-mag-dark mb-6">Autres domaines</h2>
          <div className="flex flex-wrap gap-3">
            {otherCats.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-mag-cream px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
              >
                <span>{c.icon}</span> {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
