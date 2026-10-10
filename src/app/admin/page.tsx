import { db } from "@/db";
import { artisans, categories, actualites, jemaEditions, medias, siteSettings } from "@/db/schema";
import { and, count, eq, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { KeyFiguresEditor } from "@/components/admin/KeyFiguresEditor";
import { CommunautePasswordEditor } from "@/components/admin/CommunautePasswordEditor";
import { countDossiersByStatus } from "@/lib/dossiers-db";
import { getDistinctCraftsCount } from "@/lib/stats-db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Le contrôle du layout ne couvre pas un rendu RSC partiel de la page :
  // celle-ci lit le mot de passe Communauté, elle se protège elle-même.
  await requireAdmin();

  const [
    [artisanCount],
    [categoryCount],
    [actuCount],
    [jemaCount],
    [mediaCount],
    [missingAbout],
    [settings],
    dossiers,
    distinctCrafts,
  ] = await Promise.all([
    db.select({ count: count() }).from(artisans),
    db.select({ count: count() }).from(categories),
    db.select({ count: count() }).from(actualites),
    db.select({ count: count() }).from(jemaEditions),
    db.select({ count: count() }).from(medias),
    // Fiches publiées sans texte « À propos » (contrôle périodique, cf. backlog).
    db
      .select({ count: count() })
      .from(artisans)
      .where(
        and(
          eq(artisans.published, true),
          sql`coalesce(btrim(${artisans.longDescription}), '') = ''`,
        ),
      ),
    // Ligne absente (seed pas encore lancé) → valeurs par défaut ci-dessous.
    db
      .select({
        eventsCount: siteSettings.eventsCount,
        craftsCount: siteSettings.craftsCount,
        communautePassword: siteSettings.communautePassword,
      })
      .from(siteSettings)
      .where(eq(siteSettings.id, "default"))
      .limit(1),
    // Dossiers d'onboarding (LOT A1) : en évaluation + éligibles = en cours.
    countDossiersByStatus(),
    // Métiers distincts des fiches publiées (LOT A2), à côté du chiffre saisi.
    getDistinctCraftsCount(),
  ]);
  const dossiersEnCours = dossiers.en_evaluation + dossiers.eligible;

  const stats = [
    { label: "Artisans", value: artisanCount.count, href: "/admin/artisans", icon: "fas fa-hammer", color: "text-mag-red" },
    { label: "Dossiers en cours", value: dossiersEnCours, href: "/admin/onboarding", icon: "fas fa-clipboard-check", color: "text-mag-red" },
    { label: "Catégories", value: categoryCount.count, href: "/admin/categories", icon: "fas fa-tags", color: "text-mag-red" },
    { label: "Actualités", value: actuCount.count, href: "/admin/actualites", icon: "fas fa-newspaper", color: "text-mag-red" },
    { label: "Éditions JEMA", value: jemaCount.count, href: "/admin/jema", icon: "fas fa-award", color: "text-mag-red" },
    { label: "Médias", value: mediaCount.count, href: "/admin/medias", icon: "fas fa-video", color: "text-mag-red" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="rounded-xl border border-mag-cream bg-white p-6 hover:border-mag-red/30 hover:shadow-md transition-all"
          >
            <i className={`${s.icon} text-2xl ${s.color} mb-3`} aria-hidden />
            <p className="text-3xl font-black text-mag-dark">{s.value}</p>
            <p className="mt-1 text-sm text-mag-gray">{s.label}</p>
          </a>
        ))}
      </div>

      {missingAbout.count > 0 && (
        <p className="mt-4 text-sm text-amber-800 flex items-center gap-2">
          <i className="fas fa-triangle-exclamation" aria-hidden />
          {missingAbout.count === 1
            ? "1 fiche publiée n'a pas de texte « À propos »."
            : `${missingAbout.count} fiches publiées n'ont pas de texte « À propos ».`}{" "}
          <a href="/admin/artisans" className="underline hover:text-mag-red">
            Voir les artisans
          </a>
        </p>
      )}

      {/* Chiffres saisis à la main : métiers et projets (« MAG en chiffres ») */}
      <div className="mt-6 max-w-md space-y-4">
        <KeyFiguresEditor
          initialCraftsCount={settings?.craftsCount ?? null}
          initialEventsCount={settings?.eventsCount ?? 0}
        />
        <p className="text-xs text-mag-gray">
          Indicatif : {distinctCrafts} métiers distincts cités par les fiches publiées (la nomenclature MAG fait foi,{" "}
          <a href="/admin/stats" className="underline hover:text-mag-red">voir les statistiques</a>).
        </p>
        <CommunautePasswordEditor initialPassword={settings?.communautePassword ?? ""} />
      </div>
    </div>
  );
}
