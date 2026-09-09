import { categories, artisans } from "@/lib/data";
import { HomeMapSection } from "@/components/home/HomeMapSection";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import Link from "next/link";

export default function HomePage() {
  const stats = [
    { value: artisans.length, label: "Artisanes et artisans MAG" },
    { value: new Set(artisans.map((a) => a.craft)).size, label: "Métiers MAG" },
    { value: new Set(artisans.map((a) => a.commune)).size, label: "Communes MAG" },
    { value: categories.filter((c) => c.slug !== "partenaires").length, label: "Domaines d'art" },
  ];

  const visibleCategories = categories.filter((c) => c.slug !== "partenaires");

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-mag-cream/60 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-mag-dark font-serif">
            Métiers d&apos;Art Genève
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-mag-dark/70 leading-relaxed">
            MAG est une association à but non lucratif, travaillant de pair avec les
            artisanes et artisans du canton. Nous oeuvrons afin de promouvoir, fédérer,
            reconnaître et défendre les métiers d&apos;art au travers de notre répertoire
            et de nos événements.
          </p>
          <Link
            href="/repertoire"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-mag-red px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-mag-red-dark transition-colors"
          >
            En savoir plus
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* Carte interactive — client island */}
      <HomeMapSection />

      {/* Stats */}
      <section className="py-12 bg-mag-cream/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-mag-red rounded-xl p-6 text-center text-white">
                <p className="text-3xl sm:text-4xl font-black">{s.value}</p>
                <p className="mt-1 text-sm text-white/80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grille catégories */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-mag-dark font-serif mb-8">
            Nos artisanes et artisans par domaine
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleCategories.map((cat) => {
              const count = artisans.filter(
                (a) => a.categoryName === cat.name,
              ).length;
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-mag-cream p-6 hover:border-mag-red/30 hover:shadow-md transition-all"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="text-3xl mb-3 text-mag-red" aria-hidden>
                    <CategoryIcon icon={cat.icon} />
                  </div>
                  <h3 className="font-semibold text-mag-dark group-hover:text-mag-red transition-colors">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-xs text-mag-gray">{count} artisan·e·s</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trois piliers */}
      <section className="py-16 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Patrimoine",
              body: "Les centres de formation professionnelle sont garants de la transmission des différents savoir-faire dont les apports artistiques et patrimoniaux sont essentiels à une création qualitative et au renforcement de l'identité locale.",
            },
            {
              title: "Transmission",
              body: "Leur rôle est essentiel dans la transmission de valeurs, de techniques, et de professions parfois méconnues. L'association s'engage à valoriser des métiers et à enrichir notre conception de l'artisanat d'art.",
            },
            {
              title: "Futur",
              body: "À travers l'organisation d'événements telles que les JEMA, MAG s'assure de représenter les écoles formatrices et ses nombreux métiers dans l'objectif d'offrir aux jeunes générations une nouvelle vision de l'artisanat.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="text-xl font-bold text-mag-red font-serif mb-3">
                {item.title}
              </h3>
              <p className="text-mag-dark/70 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
