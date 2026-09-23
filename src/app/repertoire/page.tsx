import { RepertoireTable } from "@/components/repertoire/RepertoireTable";
import { getArtisansOnly, getArtisanCategories } from "@/lib/db-data";

// ISR : le répertoire suit les modifications de l'admin (au plus 60 s).
export const revalidate = 60;

export const metadata = {
  title: "Répertoire",
  description:
    "Le répertoire complet des artisanes et artisans, ateliers, institutions et écoles des métiers d'art du canton de Genève.",
};

export default async function RepertoirePage() {
  const [list, categories] = await Promise.all([
    getArtisansOnly(),
    getArtisanCategories(),
  ]);

  return (
    <>
      <section className="bg-gradient-to-b from-mag-cream/60 to-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif">
            Répertoire complet
          </h1>
          <p className="mt-4 max-w-3xl text-mag-dark/70 leading-relaxed">
            Ce répertoire contient uniquement la liste des artisanes et artisans,
            des ateliers, des entreprises, des institutions culturelles et des
            écoles professionnelles qui exercent ou forment aux métiers d&apos;art
            sur le canton de Genève et qui ont participé au moins une fois aux
            Journées Européennes des Métiers d&apos;Art.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Composant client : on ne sérialise que les champs utiles au tableau
              (pas les descriptions, poinçons, contacts…) */}
          <RepertoireTable
            artisans={list.map((a) => ({
              id: a.id,
              name: a.name,
              slug: a.slug,
              craft: a.craft,
              categoryName: a.categoryName,
              commune: a.commune,
            }))}
            categories={categories}
          />
        </div>
      </section>
    </>
  );
}
