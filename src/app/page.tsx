import Image from "next/image";
import Link from "next/link";
import {
  getArtisansOnly,
  getPublishedArtisans,
  getArtisanCategories,
  getJemaEditions,
  splitJemaEditions,
  countCrafts,
  countCommunes,
  type PublicArtisan,
} from "@/lib/db-data";
import { formatShortRange } from "@/lib/dates";
import { HomeMapSection } from "@/components/home/HomeMapSection";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Marquee } from "@/components/ui/Marquee";
import { Eyebrow, SectionHeader } from "@/components/ui/Editorial";
import { canOptimizeImage } from "@/lib/utils";

// ISR : les pages se rafraîchissent au plus toutes les 60 s après une
// modification dans l'admin, tout en restant servies depuis le cache.
export const revalidate = 60;

/* Artisan·e·s mis·es en avant sur l'accueil (recherche par nom dans la base,
   photo = celle de leur fiche). Une entrée introuvable est simplement ignorée. */
const HERO_ARTISAN = "Marina Buckel";
const PORTRAITS = [
  "Fanny Kopp",
  "Béatrice de Haller",
  "La Maison de Nathalie",
  "Laura Catignani",
  "Charles Roulin",
];
const FORGE_ARTISAN = "Joshua Teegarden";
const JEMA_ARTISAN = "Frédéric Taddeï";

function findByName(list: PublicArtisan[], needle: string) {
  const n = needle.toLowerCase();
  return list.find((a) => a.imageUrl && a.name.toLowerCase().includes(n)) ?? null;
}

/** « Atelier de lutherie, Béatrice de Haller » → « Béatrice de Haller ». */
function displayName(name: string) {
  const parts = name.split(/,\s*|\s+—\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function PortraitCard({ a, big = false }: { a: PublicArtisan; big?: boolean }) {
  return (
    <Link
      href={`/artisans/${a.slug}`}
      className={`group relative block h-full overflow-hidden rounded bg-mag-cream lg:aspect-auto ${
        big ? "aspect-[4/3] sm:aspect-[16/10]" : "aspect-[4/5]"
      }`}
    >
      <Image
        src={a.imageUrl!}
        unoptimized={!canOptimizeImage(a.imageUrl!)}
        alt={`${displayName(a.name)}${a.craft ? `, ${a.craft.toLowerCase()}` : ""}, dans son atelier`}
        fill
        sizes={big ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1024px) 30vw, 50vw"}
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
      />
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-mag-footer/85 via-mag-footer/40 to-transparent pt-24 ${
          big ? "p-6 sm:p-8" : "p-5"
        }`}
      >
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-mag-cream">
          {[a.craft?.split(" • ")[0], a.commune].filter(Boolean).join(" · ")}
        </p>
        <p
          className={`mt-1.5 font-serif font-bold leading-tight text-white ${
            big ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"
          }`}
        >
          {displayName(a.name)}
          <span aria-hidden className="ml-2 inline-block opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const [artisansOnly, allEntities, artisanCategories, jemaEditions] = await Promise.all([
    getArtisansOnly(),
    getPublishedArtisans(),
    getArtisanCategories(),
    getJemaEditions(),
  ]);

  const nbArtisans = artisansOnly.length;
  const nbCrafts = countCrafts(artisansOnly);
  // Règle LOT 1 : toutes entités confondues (écoles, institutions comprises)
  const nbCommunes = countCommunes(allEntities);

  const stats = [
    { value: nbArtisans, label: "Artisanes et artisans MAG" },
    { value: nbCrafts, label: "Métiers MAG" },
    { value: nbCommunes, label: "Communes MAG" },
    { value: artisanCategories.length, label: "Domaines d'art" },
  ];

  const hero = findByName(allEntities, HERO_ARTISAN);
  const portraits = PORTRAITS.map((n) => findByName(allEntities, n)).filter(
    (a): a is PublicArtisan => !!a,
  );
  const forge = findByName(allEntities, FORGE_ARTISAN);
  const jemaArtisan = findByName(allEntities, JEMA_ARTISAN);
  const { upcoming } = splitJemaEditions(jemaEditions);

  // Métiers uniques pour le bandeau
  const uniqueCrafts = [
    ...new Set(
      artisansOnly
        .flatMap((a) => (a.craft ? a.craft.split(" • ") : []))
        .map((c) => c.trim())
        .filter(Boolean),
    ),
  ].slice(0, 24);

  const domaines = artisanCategories
    .map((cat) => ({
      ...cat,
      count: artisansOnly.filter((a) => a.categoryName === cat.name).length,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-mag-sand grain-overlay overflow-hidden border-b border-mag-cream">
        <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:min-h-[calc(100vh-5rem)]">
          <div className="flex flex-col px-4 sm:px-6 lg:px-8 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-16 pt-16 pb-12 sm:pt-24 lg:pt-28 lg:pb-14">
            <Reveal>
              <Eyebrow>✦&nbsp;&nbsp;Association genevoise des métiers d&apos;art</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <h1 className="mt-8 font-serif font-black text-mag-dark tracking-[-0.02em] leading-[0.92] text-6xl sm:text-8xl lg:text-[6.25rem] xl:text-[7.25rem] 2xl:text-[8.5rem]">
                Genève,
                <br />
                <span className="text-mag-red">à la main.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 sm:mt-10 max-w-xl text-lg sm:text-xl text-mag-dark/80 leading-relaxed">
                MAG fédère les artisanes et artisans d&apos;art du canton :
                leurs ateliers, leurs savoir-faire, leurs gestes. Poussez la porte.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  href="/repertoire"
                  className="btn-fill inline-flex items-center gap-2 rounded-full bg-mag-red px-7 py-4 text-base font-semibold text-white shadow-lg shadow-mag-red/20 hover:shadow-xl hover:shadow-mag-red/30 transition-shadow"
                >
                  Explorer le répertoire <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/qui-sommes-nous"
                  className="text-base font-semibold text-mag-dark underline decoration-mag-red decoration-2 underline-offset-[6px] hover:text-mag-red transition-colors"
                >
                  Découvrir MAG
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.4} className="mt-auto">
              <dl className="mt-14 pt-6 border-t border-mag-cream flex flex-wrap gap-x-10 gap-y-3 text-sm text-mag-gray">
                {stats.slice(0, 3).map((s) => (
                  <div key={s.label} className="flex items-baseline gap-2">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-serif text-2xl font-bold text-mag-dark">{s.value}</dd>
                    <span aria-hidden>{s.label.replace(" MAG", "").toLowerCase()}</span>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <div className="relative min-h-[420px] sm:min-h-[560px] lg:min-h-0 bg-mag-cream">
            <Image
              src={hero?.imageUrl ?? "/artisan-hands.jpg"}
              unoptimized={!canOptimizeImage(hero?.imageUrl ?? "/artisan-hands.jpg")}
              alt={
                hero
                  ? `${displayName(hero.name)}, ${hero.craft?.toLowerCase() ?? "artisane"}, dans son atelier`
                  : "Mains d'artisan travaillant le bois dans son atelier"
              }
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover object-[30%_center] animate-clip-reveal"
            />
            {hero && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mag-footer/80 to-transparent px-6 sm:px-10 pt-28 pb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mag-cream">
                    Portrait du mois
                  </p>
                  <p className="mt-1.5 font-serif text-2xl sm:text-3xl font-bold text-white">
                    {displayName(hero.name)}, {hero.craft?.toLowerCase()} à {hero.commune}
                  </p>
                </div>
                <Link
                  href={`/artisans/${hero.slug}`}
                  className="focus-ring-white inline-flex items-center gap-2 rounded-full border border-white/70 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white hover:text-mag-dark transition-colors"
                >
                  Voir l&apos;atelier <span aria-hidden>→</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Bandeau des métiers ─────────────────────────────── */}
      <Marquee items={uniqueCrafts} variant="band" speed={45} />

      {/* ─── Portraits ───────────────────────────────────────── */}
      {portraits.length > 0 && (
        <section className="py-20 sm:py-28 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Portraits"
              title="Le geste, la matière, le temps"
              aside={
                <>
                  <p>
                    Chaque artisan·e de MAG porte un savoir-faire unique, fruit
                    d&apos;années d&apos;apprentissage, d&apos;exigence et de passion.
                  </p>
                  <Link
                    href="/repertoire"
                    className="mt-4 inline-block font-semibold text-mag-red hover:text-mag-red-dark transition-colors"
                  >
                    Voir les {nbArtisans} artisan·e·s →
                  </Link>
                </>
              }
            />
            <div className="grid grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr] lg:grid-rows-[340px_340px] gap-3 sm:gap-4">
              {portraits.map((a, i) => (
                <Reveal key={a.id} delay={i * 0.08} className={i === 0 ? "col-span-2 lg:col-span-1 lg:row-span-2" : ""}>
                  <div className="h-full">
                    <PortraitCard a={a} big={i === 0} />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── MAG en chiffres (section sombre) ─────────────────── */}
      <section className="bg-mag-footer text-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative min-h-[360px] lg:min-h-[760px]">
          <Image
            src={forge?.imageUrl ?? "/artisan-tools.jpg"}
              unoptimized={!canOptimizeImage(forge?.imageUrl ?? "/artisan-tools.jpg")}
            alt={forge ? `Coulée de métal en fusion chez ${displayName(forge.name)}, ${forge.craft?.toLowerCase()}` : "Outils d'artisan sur un établi"}
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="object-cover"
          />
          {forge && (
            <p className="absolute left-6 bottom-5 text-xs tracking-wide text-white/85">
              {displayName(forge.name)}, {forge.craft?.toLowerCase()} · {forge.commune}
            </p>
          )}
        </div>
        <div className="px-4 sm:px-6 lg:px-16 xl:px-24 py-20 sm:py-28 flex flex-col">
          <Reveal>
            <Eyebrow tone="cream">MAG en chiffres</Eyebrow>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-x-8 sm:gap-x-14 gap-y-12">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1}>
                <div className="pt-6 border-t border-mag-cream/25">
                  <p className="font-serif font-black leading-[0.9] text-6xl sm:text-8xl">
                    <AnimatedCounter value={s.value} />
                  </p>
                  <p className="mt-3 text-sm sm:text-base text-mag-cream/80">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} className="mt-16 lg:mt-auto lg:pt-16">
            <blockquote className="font-serif text-xl sm:text-2xl leading-relaxed text-mag-cream/90 max-w-2xl">
              « Quand vous faites travailler un·e artisan·e, vous achetez bien plus
              qu&apos;un service. Vous reconnaissez la maîtrise d&apos;un geste. »
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ─── Domaines : sommaire numéroté ─────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Répertoire"
            title="Les domaines d'art"
            aside="Du textile au métal, de l'horlogerie à la pierre, explorez la richesse des savoir-faire genevois."
          />
          <ol className="grid md:grid-cols-2 md:gap-x-16 lg:gap-x-20 border-b border-mag-cream md:[&>li:nth-last-child(2)]:border-b-0">
            {domaines.map((cat, i) => (
              <li key={cat.id} className="border-t border-mag-cream">
                <Link
                  href={`/categories/${cat.slug}`}
                  className="group flex items-baseline gap-5 sm:gap-6 py-5 sm:py-6"
                >
                  <span className="w-8 shrink-0 font-serif text-base sm:text-lg font-bold text-mag-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grow font-serif text-2xl sm:text-[1.75rem] leading-snug text-mag-dark group-hover:text-mag-red transition-colors">
                    {cat.name}
                  </span>
                  <span className="shrink-0 text-sm text-mag-gray whitespace-nowrap">
                    {cat.count} <span className="hidden sm:inline">artisan·e·s</span>
                    <span aria-hidden className="ml-2 inline-block transition-transform group-hover:translate-x-1 text-mag-red">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Carte interactive ────────────────────────────────── */}
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

      {/* ─── JEMA ─────────────────────────────────────────────── */}
      <section className="bg-mag-red text-white focus-ring-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 grid lg:grid-cols-[minmax(0,1fr)_420px] gap-12 lg:gap-20 items-center">
          <div>
            <Reveal>
              <Eyebrow tone="cream">{upcoming ? "Prochaine édition" : "Rendez-vous annuel"}</Eyebrow>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 font-black tracking-[-0.03em] leading-[0.9] text-6xl sm:text-8xl lg:text-9xl">
                JEMA{upcoming ? ` ${upcoming.year}` : ""}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-xl text-lg sm:text-xl leading-relaxed text-white/90">
                Journées Européennes des Métiers d&apos;Art : les ateliers genevois
                ouvrent leurs portes.
                {upcoming?.startDate && (
                  <strong className="block mt-2 font-semibold text-white">
                    {formatShortRange(upcoming.startDate, upcoming.endDate)}
                  </strong>
                )}
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/jema"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-mag-red hover:bg-mag-cream transition-colors"
                >
                  Préparer ma visite <span aria-hidden>→</span>
                </Link>
                <Link
                  href="/repertoire"
                  className="inline-flex items-center gap-2 rounded-full border border-white/70 px-7 py-4 text-base font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Trouver un atelier
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-mag-red-dark">
              <Image
                src={jemaArtisan?.imageUrl ?? "/artisan-tools.jpg"}
              unoptimized={!canOptimizeImage(jemaArtisan?.imageUrl ?? "/artisan-tools.jpg")}
                alt={
                  jemaArtisan
                    ? `${displayName(jemaArtisan.name)}, ${jemaArtisan.craft?.toLowerCase()}, dans son atelier`
                    : "Outils d'artisan sur un établi"
                }
                fill
                sizes="(min-width: 1024px) 420px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
