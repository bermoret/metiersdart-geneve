import { notFound } from "next/navigation";
import Link from "next/link";
import { RepertoireTable } from "@/components/repertoire/RepertoireTable";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { PageHero } from "@/components/ui/Editorial";
import { getDirectories } from "@/lib/db-data";
import { DIRECTORIES } from "@/lib/data";

// Autres répertoires (institutions culturelles, écoles formatrices,
// associations professionnelles, partenaires), aux mêmes URLs que l'ancien
// site : /repertoire/<slug>. ISR comme le répertoire complet.
export const revalidate = 60;
// Seuls les quatre répertoires existent : tout autre slug répond 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return DIRECTORIES.map((d) => ({ slug: d.slug }));
}

async function getDirectory(slug: string) {
  return (await getDirectories()).find((d) => d.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dir = await getDirectory(slug);
  if (!dir) return { title: "Répertoire introuvable" };
  return {
    title: `${dir.name} — Répertoire`,
    description:
      dir.description ?? `${dir.name} du répertoire des métiers d'art du canton de Genève.`,
    alternates: { canonical: `/repertoire/${slug}` },
  };
}

export default async function DirectoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const directories = await getDirectories();
  const dir = directories.find((d) => d.slug === slug);
  // Répertoire vidé dans l'admin : 404, comme sur l'accueil où il est masqué.
  if (!dir || dir.entities.length === 0) notFound();

  const count = dir.entities.length;

  return (
    <>
      <PageHero
        compact
        eyebrow={
          <>
            <CategoryIcon icon={dir.icon} />
            &nbsp;&nbsp;Répertoire MAG · {count} {dir.unit[count > 1 ? 1 : 0]}
          </>
        }
        title={dir.name}
        lead={dir.description ? <p>{dir.description}</p> : undefined}
      />

      <section className="pt-10 sm:pt-12 pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Pas de domaines ici : ni filtre ni colonne « Domaine » */}
          <RepertoireTable
            artisans={dir.entities.map((a) => ({
              id: a.id,
              name: a.name,
              slug: a.slug,
              craft: a.craft,
              categoryName: a.categoryName,
              commune: a.commune,
            }))}
            categories={[]}
          />
        </div>
      </section>

      {/* Navigation vers les autres répertoires */}
      <section className="py-16 sm:py-20 bg-mag-sand">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="h-section mb-8">Autres répertoires</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/repertoire"
              className="inline-flex items-center gap-2 rounded-full border border-mag-cream bg-white px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
            >
              Répertoire complet
            </Link>
            {directories
              .filter((d) => d.slug !== slug && d.entities.length > 0)
              .map((d) => (
                <Link
                  key={d.slug}
                  href={`/repertoire/${d.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-mag-cream bg-white px-4 py-2 text-sm font-medium text-mag-dark/70 hover:border-mag-red hover:text-mag-red transition-colors"
                >
                  <CategoryIcon icon={d.icon} />
                  {d.name}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
