import Image from "next/image";
import { categories, artisans } from "@/lib/data";
import { HomeMapSection } from "@/components/home/HomeMapSection";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Marquee } from "@/components/ui/Marquee";
import Link from "next/link";

export default function HomePage() {
  const stats = [
    { value: artisans.length, label: "Artisanes et artisans MAG" },
    { value: new Set(artisans.map((a) => a.craft)).size, label: "Métiers MAG" },
    { value: new Set(artisans.map((a) => a.commune)).size, label: "Communes MAG" },
    { value: categories.filter((c) => c.slug !== "partenaires").length, label: "Domaines d'art" },
  ];

  const visibleCategories = categories.filter((c) => c.slug !== "partenaires");

  // Métiers uniques pour le marquee
  const uniqueCrafts = [...new Set(artisans.map((a) => a.craft))].slice(0, 24);

  const pillars = [
    {
      title: "Patrimoine",
      body: "Les centres de formation professionnelle sont garants de la transmission des différents savoir-faire dont les apports artistiques et patrimoniaux sont essentiels à une création qualitative et au renforcement de l'identité locale.",
      icon: "fas fa-landmark",
    },
    {
      title: "Transmission",
      body: "Leur rôle est essentiel dans la transmission de valeurs, de techniques, et de professions parfois méconnues. L'association s'engage à valoriser des métiers et à enrichir notre conception de l'artisanat d'art.",
      icon: "fas fa-hands-helping",
    },
    {
      title: "Futur",
      body: "À travers l'organisation d'événements telles que les JEMA, MAG s'assure de représenter les écoles formatrices et ses nombreux métiers dans l'objectif d'offrir aux jeunes générations une nouvelle vision de l'artisanat.",
      icon: "fas fa-seedling",
    },
  ];

  return (
    <>
      {/* ─── Hero split-screen ─────────────────────────────────── */}
      <section className="relative grain-overlay bg-gradient-to-b from-mag-cream/60 to-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Colonne texte */}
            <div className="text-center lg:text-left">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-mag-red/20 bg-mag-red/5 px-4 py-1.5 text-xs font-semibold text-mag-red uppercase tracking-wide mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-mag-red animate-pulse" />
                  Association genevoise des métiers d&apos;art
                </span>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-mag-dark font-serif leading-[1.05]">
                  Métiers
                  <br />
                  <span className="text-shimmer">d&apos;Art Genève</span>
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
                  className="btn-fill mt-8 inline-flex items-center gap-2 rounded-full bg-mag-red px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-mag-red/20 hover:shadow-xl hover:shadow-mag-red/30 transition-shadow"
                >
                  Trouvez les professionnel·le·s des métiers d&apos;art proche de chez vous
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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-mag-dark/40 via-transparent to-transparent" />
              </div>
              {/* Badge flottant */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 border border-mag-cream">
                <p className="font-serif text-3xl font-black text-mag-red">{artisans.length}+</p>
                <p className="text-xs text-mag-gray mt-1">artisans référencés</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Marquee des métiers ───────────────────────────────── */}
      <Marquee items={uniqueCrafts} className="py-6 border-y border-mag-cream bg-mag-sand/50" />

      {/* ─── Carte interactive ──────────────────────────────────── */}
      <HomeMapSection />

      {/* ─── Stats avec compteurs animés ────────────────────────── */}
      <section className="py-16 bg-mag-cream/30 grain-overlay">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center text-2xl sm:text-3xl font-bold text-mag-dark font-serif mb-10">
              MAG en chiffres
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              const count = artisans.filter(
                (a) => a.categoryName === cat.name,
              ).length;
              return (
                <Reveal key={cat.id} delay={0.04 * (visibleCategories.indexOf(cat))}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="group block rounded-2xl bg-mag-sand p-6 card-hover hover:shadow-lg hover:shadow-mag-dark/5 ring-1 ring-mag-cream/60 hover:ring-mag-red/20"
                  >
                    <div className="text-3xl mb-3 text-mag-red transition-transform duration-300 group-hover:scale-110" aria-hidden>
                      <CategoryIcon icon={cat.icon} />
                    </div>
                    <h3 className="font-semibold text-mag-dark group-hover:text-mag-red transition-colors leading-snug">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-xs text-mag-gray flex items-center gap-1">
                      <span>{count}</span>
                      <span>artisan·e·s</span>
                      <span className="ml-auto opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-mag-red">→</span>
                    </p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Trois piliers ──────────────────────────────────────── */}
      <section className="py-20 bg-mag-sand grain-overlay">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center text-3xl sm:text-4xl font-bold text-mag-dark font-serif mb-2">
              Notre mission
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-center text-mag-gray mb-12 max-w-2xl mx-auto">
              Trois axes fondamentaux guident l&apos;action de MAG au quotidien.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.15}>
                <div className="bg-white rounded-2xl p-8 border border-mag-cream card-hover hover:shadow-lg h-full">
                  <div className="w-14 h-14 rounded-full bg-mag-red/10 flex items-center justify-center mb-5">
                    <i className={`${item.icon} text-2xl text-mag-red`} aria-hidden />
                  </div>
                  <h3 className="text-xl font-bold text-mag-red font-serif mb-3">
                    {item.title}
                  </h3>
                  <p className="text-mag-dark/70 leading-relaxed text-sm">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
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
                Explorer le répertoire →
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
