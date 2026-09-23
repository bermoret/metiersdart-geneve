import Image from "next/image";
import {
  getArtisansOnly,
  getPublishedArtisans,
  getArtisanCategories,
  countCommunes,
  getJemaEditions,
  splitJemaEditions,
} from "@/lib/db-data";
import { formatShortRange } from "@/lib/dates";
import { canOptimizeImage } from "@/lib/utils";
import { getSiteSettings } from "@/lib/site-settings";
import { HomeMapSection } from "@/components/home/HomeMapSection";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Marquee } from "@/components/ui/Marquee";
import Link from "next/link";

// ISR : les pages se rafraîchissent au plus toutes les 60 s après une
// modification dans l'admin, tout en restant servies depuis le cache.
export const revalidate = 60;

/* Photo du bandeau JEMA : celle de la fiche de cet artisan (recherche par nom),
   à défaut une photo d'atelier locale. */
const JEMA_ARTISAN = "Frédéric Taddeï";
const JEMA_FALLBACK_IMAGE = "/artisan-tools.jpg";

/* Nombre de métiers selon la nomenclature de MAG (Stat_GLOBALES, 01.09.26) :
   les libellés de métier en base (plus de 80 variantes) ne s'y ramènent pas. */
const CRAFTS_COUNT = 53;

export default async function HomePage() {
  const [artisansOnly, allEntities, artisanCategories, jemaEditions, settings] = await Promise.all([
    getArtisansOnly(),
    getPublishedArtisans(),
    getArtisanCategories(),
    // Une panne de la table JEMA ne doit pas faire tomber l'accueil : bandeau générique.
    getJemaEditions().catch(() => []),
    getSiteSettings(),
  ]);

  // Bandeau JEMA : prochaine édition saisie dans l'admin, sinon rendez-vous générique.
  const { upcoming } = splitJemaEditions(jemaEditions);
  const jemaArtisan = allEntities.find(
    (a) => a.imageUrl && a.name.toLowerCase().includes(JEMA_ARTISAN.toLowerCase()),
  );
  const jemaImage = jemaArtisan?.imageUrl ?? JEMA_FALLBACK_IMAGE;

  // « MAG en chiffres » selon le tableau de statistiques de MAG (retour du 23.09) :
  // artisan·e·s et communes calculés (communes où exercent les artisan·e·s, sans
  // les écoles ni les institutions), métiers selon la nomenclature MAG, projets
  // menés saisis dans l'admin (masqués tant qu'ils valent 0).
  const stats = [
    { value: artisansOnly.length, label: "Artisanes et artisans MAG" },
    { value: CRAFTS_COUNT, label: "Métiers" },
    { value: countCommunes(artisansOnly), label: "Communes" },
    ...(settings?.eventsCount ? [{ value: settings.eventsCount, label: "Projets menés" }] : []),
  ];

  const visibleCategories = artisanCategories;

  // Métiers uniques pour le marquee (un artisan peut en cumuler : « A • B »)
  const uniqueCrafts = [
    ...new Set(
      artisansOnly
        .flatMap((a) => (a.craft ? a.craft.split(" • ") : []))
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ].slice(0, 24);

  return (
    <>
      {/* ─── Hero split-screen ─────────────────────────────────── */}
      <section className="relative grain-overlay bg-gradient-to-b from-mag-cream/60 to-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Colonne texte */}
            <div className="text-center lg:text-left">
              {/* Retours MAG : (MAG) après le nom (19.09), pastille « Bienvenue chez MAG »
                  au lieu de « Association genevoise des métiers d'art » (23.09). */}
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-mag-red/20 bg-mag-red/5 px-4 py-1.5 text-xs font-semibold text-mag-red uppercase tracking-wide mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-mag-red animate-pulse" aria-hidden />
                  Bienvenue chez MAG
                </span>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-mag-dark font-serif leading-[1.05]">
                  Métiers
                  <br />
                  <span className="text-shimmer">d&apos;Art Genève</span>{" "}
                  <span className="whitespace-nowrap">(MAG)</span>
                </h1>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="mt-6 max-w-xl text-lg sm:text-xl text-mag-dark/70 leading-relaxed mx-auto lg:mx-0">
                  MAG est une association à but non lucratif, travaillant de pair avec les
                  artisanes et artisans du canton. Nous oeuvrons afin de promouvoir, fédérer,
                  reconnaître et défendre les métiers d&apos;art au travers de notre répertoire
                  et de nos événements.
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <Link
                  href="/repertoire"
                  className="group btn-fill mt-8 inline-flex items-center gap-2 rounded-full bg-mag-red px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-mag-red/20 hover:shadow-xl hover:shadow-mag-red/30 transition-shadow"
                >
                  Trouver les artisanes et artisans proches de chez vous
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </Reveal>
            </div>

            {/* Colonne image — clip reveal (visible sur mobile, en dessous du texte) */}
            <div className="relative">
              <div className="animate-clip-reveal relative aspect-[4/3] sm:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-mag-cream">
                <Image
                  src="/artisan-hands.jpg"
                  alt="Mains d'artisan travaillant le bois dans son atelier"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-mag-dark/40 via-transparent to-transparent" />
              </div>
              {/* Badge flottant */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-mag-cream">
                <p className="font-serif text-3xl font-black text-mag-red">{artisansOnly.length}</p>
                <p className="text-xs text-mag-gray mt-1">artisans référencés</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Marquee des métiers ───────────────────────────────── */}
      <Marquee items={uniqueCrafts} className="py-6 border-y border-mag-cream bg-mag-sand/50" />

      {/* ─── Carte interactive ──────────────────────────────────── */}
      <HomeMapSection
        artisans={artisansOnly.map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          craft: a.craft,
          commune: a.commune,
          latitude: a.latitude ?? 0,
          longitude: a.longitude ?? 0,
          category: { name: a.categoryName ?? "", color: null },
        }))}
        categories={artisanCategories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }))}
      />

      {/* ─── Stats avec compteurs animés ────────────────────────── */}
      <section className="py-16 bg-mag-cream/30 grain-overlay">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-mag-dark font-serif mb-10">
              MAG en chiffres
            </h2>
          </Reveal>
          <div className={`grid gap-4 ${stats.length === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.12}>
                <div className="bg-mag-red rounded-2xl p-8 text-center text-white card-hover shadow-lg shadow-mag-red/10">
                  <p className="text-4xl sm:text-5xl font-black font-serif">
                    <AnimatedCounter value={s.value} />
                  </p>
                  <p className="mt-2 text-sm text-white/80 leading-snug">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section narrative — photo outils + citation ─────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Photo outils */}
            <Reveal>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl bg-mag-cream">
                <Image
                  src="/artisan-tools.jpg"
                  alt="Outils d'artisan sur un établi"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            {/* Texte */}
            <div>
              <Reveal>
                <h2 className="text-3xl sm:text-4xl font-bold text-mag-dark font-serif mb-6 leading-tight">
                  Le geste, la matière, le temps
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-lg text-mag-dark/70 leading-relaxed mb-6">
                  Chaque artisan·e de MAG porte un savoir-faire unique, fruit
                  d&apos;années d&apos;apprentissage, d&apos;exigence et de passion.
                  Du geste précis à l&apos;œuvre accomplie, c&apos;est toute une histoire
                  qui se transmet.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <blockquote className="border-l-4 border-mag-red pl-6 italic text-mag-dark/80 font-serif text-lg leading-relaxed">
                  Quand vous faites travailler un·e artisan·e, vous achetez bien plus
                  qu&apos;un service. Vous reconnaissez la maîtrise d&apos;un geste,
                  l&apos;exigence d&apos;un savoir-faire et des centaines d&apos;heures
                  d&apos;essais, d&apos;échecs et d&apos;expérimentations.
                </blockquote>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Grille catégories ──────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-mag-dark font-serif mb-2">
              Nos artisanes et artisans par domaine
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-mag-gray mb-10 max-w-2xl">
              Du textile au métal, de l&apos;horlogerie à la pierre, explorez la richesse
              des savoir-faire genevois.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {visibleCategories.map((cat) => {
              const count = artisansOnly.filter(
                (a) => a.categoryName === cat.name,
              ).length;
              return (
                <Reveal key={cat.id} delay={0.04 * (visibleCategories.indexOf(cat))}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="group block rounded-2xl bg-mag-sand p-6 card-hover hover:shadow-lg hover:shadow-mag-dark/5 ring-1 ring-mag-cream/60 hover:ring-mag-red/20"
                  >
                    <div className="text-3xl mb-3 text-mag-red transition-transform duration-300 group-hover:scale-110" aria-hidden>
                      <CategoryIcon icon={cat.icon ?? ""} />
                    </div>
                    <h3 className="font-semibold text-mag-dark group-hover:text-mag-red transition-colors leading-snug">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-xs text-mag-gray flex items-center gap-1">
                      <span>{count}</span>
                      <span>artisan·e·s</span>
                      <span aria-hidden className="ml-auto opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-mag-red">→</span>
                    </p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── JEMA ───────────────────────────────────────────────── */}
      <section className="pb-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-mag-red to-mag-red-dark text-white shadow-xl shadow-mag-red/20 focus-ring-white">
              <div className="grid lg:grid-cols-2 items-stretch">
                <div className="p-8 sm:p-12 lg:p-14 text-center lg:text-left">
                  <p className="text-sm font-semibold uppercase tracking-wide text-mag-cream">
                    {upcoming ? "Prochaine édition" : "Rendez-vous annuel"}
                  </p>
                  <h2 className="mt-3 text-4xl sm:text-5xl font-black font-serif">
                    JEMA{upcoming ? ` ${upcoming.year}` : ""}
                  </h2>
                  <p className="mt-5 text-lg text-white/90 leading-relaxed max-w-xl mx-auto lg:mx-0">
                    Journées Européennes des Métiers d&apos;Art : les ateliers genevois
                    ouvrent leurs portes.
                  </p>
                  {upcoming?.startDate && (
                    <p className="mt-4 inline-flex items-center gap-2 text-lg font-semibold">
                      <i className="fas fa-calendar-alt text-mag-cream" aria-hidden />
                      {formatShortRange(upcoming.startDate, upcoming.endDate)}
                    </p>
                  )}
                  <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
                    <Link
                      href="/jema"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-mag-red shadow-lg shadow-mag-dark/10 hover:bg-mag-cream transition-colors"
                    >
                      Préparer ma visite <span aria-hidden>→</span>
                    </Link>
                    <Link
                      href="/repertoire"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 px-7 py-3.5 text-base font-semibold text-white hover:border-white hover:bg-white/10 transition-all"
                    >
                      Trouver un atelier
                    </Link>
                  </div>
                </div>
                <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[380px] bg-mag-red-dark">
                  <Image
                    src={jemaImage}
                    unoptimized={!canOptimizeImage(jemaImage)}
                    alt={
                      jemaArtisan
                        ? `${jemaArtisan.name}${jemaArtisan.craft ? `, ${jemaArtisan.craft.toLowerCase()}` : ""}, dans son atelier`
                        : "Outils d'artisan sur un établi"
                    }
                    fill
                    sizes="(min-width: 1280px) 608px, (min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA final ──────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-b from-white to-mag-cream/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-black text-mag-dark font-serif mb-4">
              Partagez votre passion des métiers d&apos;art
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-mag-dark/70 text-lg mb-8 max-w-2xl mx-auto">
              Que vous soyez artisan·e, amateur ou curieux, rejoignez la communauté MAG
              et découvrez les savoir-faire qui font rayonner Genève.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/repertoire"
                className="btn-fill inline-flex items-center gap-2 rounded-full bg-mag-red px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-mag-red/20 transition-shadow hover:shadow-xl"
              >
                Explorer le répertoire <span aria-hidden>→</span>
              </Link>
              <Link
                href="/qui-sommes-nous"
                className="inline-flex items-center gap-2 rounded-full border-2 border-mag-red/20 px-7 py-3.5 text-base font-semibold text-mag-red hover:border-mag-red hover:bg-mag-red/5 transition-all"
              >
                Découvrir MAG
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
