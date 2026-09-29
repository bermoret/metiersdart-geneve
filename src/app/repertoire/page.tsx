import { RepertoireTable } from "@/components/repertoire/RepertoireTable";
import { getArtisansOnly, getArtisanCategories } from "@/lib/db-data";
import { PageHero } from "@/components/ui/Editorial";

// ISR : le répertoire suit les modifications de l'admin (au plus 60 s).
export const revalidate = 60;

export const metadata = {
  title: "Répertoire",
  description:
    "Le répertoire complet des artisanes et artisans, ateliers et entreprises des métiers d'art du canton de Genève.",
};

export default async function RepertoirePage() {
  const [list, categories] = await Promise.all([
    getArtisansOnly(),
    getArtisanCategories(),
  ]);

  // En-tête compact, sans chapô ni bouton carte (retour MAG du 28.09) : la
  // liste commence plus haut.
  return (
    <>
      <PageHero
        compact
        eyebrow={<>Répertoire MAG</>}
        title={<>Répertoire</>}
        accent={<>complet</>}
      />

      <section className="pt-10 sm:pt-12 pb-16 sm:pb-24">
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
