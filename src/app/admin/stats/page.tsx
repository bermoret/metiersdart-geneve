import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { communes } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { findCommuneName } from "@/lib/commune-match";
import { DEACTIVATION_REASONS, DOSSIER_STATUSES } from "@/lib/dossier-fields";
import { formatDay } from "@/lib/dates";
import { getCommuneView, getStatsOverview } from "@/lib/stats-db";

export const dynamic = "force-dynamic";

// Statistiques des artisans (LOT A2) : effectifs, évolution, domaines,
// communes, sorties, écarts entre dossiers et fiches, vue par commune, export
// Excel au format de MAG. Agrégats calculés à la demande, aucune table dédiée.
export default async function AdminStatsPage({ searchParams }: { searchParams: Promise<{ commune?: string }> }) {
  await requireAdmin();
  const { commune: communeParam } = await searchParams;
  const [stats, communeNames] = await Promise.all([
    getStatsOverview(),
    db.select({ name: communes.name }).from(communes).orderBy(asc(communes.name)).then((r) => r.map((c) => c.name)),
  ]);
  const selected = communeParam ? findCommuneName(communeParam.slice(0, 100), communeNames) : undefined;
  const view = selected ? await getCommuneView(selected) : null;
  const maxActive = Math.max(1, ...stats.evolution.map((p) => p.active));
  const maxDomaine = Math.max(1, ...stats.byDomaine.map((d) => d.count));
  const reasonLabel = (r: string) => DEACTIVATION_REASONS.find((x) => x.value === r)?.label ?? r;

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mag-dark font-serif">Statistiques</h1>
          <p className="mt-1 text-sm text-mag-gray">Calculées depuis les dossiers d&apos;onboarding et les fiches, au {formatDay(stats.generatedAt)}.</p>
        </div>
        <a
          href="/api/admin/export/stat-globales"
          className="inline-flex items-center gap-2 rounded-lg bg-mag-red px-4 py-2 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors"
        >
          <i className="fas fa-file-excel" aria-hidden /> Télécharger Stat_GLOBALES (Excel)
        </a>
      </div>
      <p className="mb-8 rounded-lg border border-mag-cream bg-mag-sand/30 px-4 py-3 text-sm text-mag-dark/80">
        Le classeur reprend le format du fichier de MAG. Onglets régénérés depuis la base : Artisan·e·s, GLOBAL
        (noms, poinçons, caisses AVS, listes), Cartographie artisans, Cartographie métiers, Entreprises formatrices,
        Métiers, Communes. Les autres onglets (listes historiques, INMA, ASMA, RECAP, Capsules…) sont ceux du
        classeur de référence du 01.09.2026.
      </p>

      {/* Effectifs */}
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {DOSSIER_STATUSES.map((s) => (
          <div key={s.value} className="rounded-xl border border-mag-cream bg-white p-5">
            <p className="text-3xl font-black text-mag-dark">{stats.byStatus[s.value]}</p>
            <p className="mt-1 text-sm text-mag-gray">Dossiers {s.label.toLowerCase()}</p>
          </div>
        ))}
        <div className="rounded-xl border border-mag-cream bg-white p-5">
          <p className="text-3xl font-black text-mag-dark">{stats.publishedArtisans}</p>
          <p className="mt-1 text-sm text-mag-gray">Fiches artisan publiées (compteur public)</p>
        </div>
      </section>

      {/* Évolution */}
      <section className="mb-8 rounded-xl border border-mag-cream bg-white p-5">
        <h2 className="text-base font-bold text-mag-dark font-serif">Évolution par année</h2>
        <p className="mt-1 mb-3 text-sm text-mag-gray">Intégrations, sorties et effectif actif au 31 décembre (année en cours : à ce jour).</p>
        <table className="w-full text-sm">
          <thead className="text-left text-mag-dark/80">
            <tr>
              <th className="py-2 pr-4">Année</th>
              <th className="py-2 pr-4">Intégrations</th>
              <th className="py-2 pr-4">Sorties</th>
              <th className="py-2 pr-4">Actifs</th>
              <th className="py-2 w-1/2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-mag-cream/60">
            {stats.evolution.map((p) => (
              <tr key={p.year}>
                <td className="py-2 pr-4 font-medium text-mag-dark">{p.year}</td>
                <td className="py-2 pr-4 text-mag-dark/70">{p.integrated}</td>
                <td className="py-2 pr-4 text-mag-dark/70">{p.exits}</td>
                <td className="py-2 pr-4 font-semibold text-mag-dark">{p.active}</td>
                <td className="py-2">
                  <div className="h-3 rounded bg-mag-red/80" style={{ width: `${Math.round((p.active / maxActive) * 100)}%` }} aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Domaines */}
        <section className="rounded-xl border border-mag-cream bg-white p-5">
          <h2 className="text-base font-bold text-mag-dark font-serif">Artisan·e·s actifs par domaine</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.byDomaine.map((d) => (
              <li key={d.key}>
                <div className="flex justify-between">
                  <span className="text-mag-dark">{d.key}</span>
                  <span className="font-semibold text-mag-dark">{d.count}</span>
                </div>
                <div className="mt-1 h-2 rounded bg-mag-cream/60">
                  <div className="h-2 rounded bg-mag-red/70" style={{ width: `${Math.round((d.count / maxDomaine) * 100)}%` }} aria-hidden />
                </div>
              </li>
            ))}
            {stats.byDomaine.length === 0 && <li className="text-mag-gray">Aucun dossier actif.</li>}
          </ul>
        </section>

        {/* Communes */}
        <section className="rounded-xl border border-mag-cream bg-white p-5">
          <h2 className="text-base font-bold text-mag-dark font-serif">Artisan·e·s actifs par commune</h2>
          <ul className="mt-3 columns-2 gap-6 text-sm">
            {stats.byCommune.map((c) => (
              <li key={c.key} className="flex justify-between py-0.5">
                <Link href={`/admin/stats?commune=${encodeURIComponent(c.key)}`} className="text-mag-dark hover:text-mag-red">{c.key}</Link>
                <span className="font-semibold text-mag-dark">{c.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sorties */}
        <section className="rounded-xl border border-mag-cream bg-white p-5">
          <h2 className="text-base font-bold text-mag-dark font-serif">Sorties par année et motif</h2>
          {stats.exits.length === 0 ? (
            <p className="mt-3 text-sm text-mag-gray">Aucune sortie enregistrée.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-mag-cream/60">
                {stats.exits.map((e) => (
                  <tr key={`${e.year}-${e.reason}`}>
                    <td className="py-1.5 pr-4 text-mag-dark">{e.year ?? "date inconnue"}</td>
                    <td className="py-1.5 pr-4 text-mag-dark/70">{reasonLabel(e.reason)}</td>
                    <td className="py-1.5 text-right font-semibold text-mag-dark">{e.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Métiers */}
        <section className="rounded-xl border border-mag-cream bg-white p-5">
          <h2 className="text-base font-bold text-mag-dark font-serif">Compteur « Métiers »</h2>
          <p className="mt-3 text-sm text-mag-dark">
            Saisi dans l&apos;admin (nomenclature MAG) : <strong>{stats.crafts.manual ?? "—"}</strong>
          </p>
          <p className="mt-1 text-sm text-mag-dark">
            Métiers distincts cités par les fiches publiées : <strong>{stats.crafts.distinctFromFiches}</strong>
          </p>
          <p className="mt-2 text-xs text-mag-gray">
            Indicatif : les fiches citent parfois plusieurs métiers (« Bijoutier · Joaillier ») et une graphie
            différente de la nomenclature MAG. Le chiffre public reste celui saisi tant que la règle de comptage
            n&apos;est pas validée. Ex. : {stats.crafts.sample.join(", ")}…
          </p>
        </section>
      </div>

      {/* Écarts */}
      {(stats.gaps.activeWithoutPublishedFiche.length > 0 || stats.gaps.publishedWithoutDossier.length > 0) && (
        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50/50 p-5 text-sm">
          <h2 className="text-base font-bold text-mag-dark font-serif">Écarts à vérifier</h2>
          {stats.gaps.activeWithoutPublishedFiche.length > 0 && (
            <p className="mt-2 text-mag-dark">
              <strong>Dossiers actifs sans fiche publiée</strong> ({stats.gaps.activeWithoutPublishedFiche.length}) : {stats.gaps.activeWithoutPublishedFiche.join(", ")}
            </p>
          )}
          {stats.gaps.publishedWithoutDossier.length > 0 && (
            <p className="mt-2 text-mag-dark">
              <strong>Fiches publiées sans dossier</strong> ({stats.gaps.publishedWithoutDossier.length}) : {stats.gaps.publishedWithoutDossier.join(", ")}
              {" "}— créez le dossier depuis la fiche (« Fiche interne »).
            </p>
          )}
        </section>
      )}

      {/* Vue par commune */}
      <section className="mb-10 rounded-xl border border-mag-cream bg-white p-5">
        <h2 className="text-base font-bold text-mag-dark font-serif">Vue par commune</h2>
        <p className="mt-1 mb-3 text-sm text-mag-gray">Artisan·e·s, écoles, institutions et partenaires d&apos;une commune, pour appuyer une demande de soutien.</p>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-mag-gray">Commune</span>
            <select name="commune" defaultValue={selected ?? ""} className="rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none">
              <option value="">— Choisir —</option>
              {communeNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-lg border border-mag-cream px-4 py-2 text-sm font-medium text-mag-dark hover:border-mag-red hover:text-mag-red cursor-pointer">
            Afficher
          </button>
          {selected && (
            <a href={`/api/admin/export/commune?commune=${encodeURIComponent(selected)}`} className="inline-flex items-center gap-2 rounded-lg bg-mag-red px-4 py-2 text-sm font-semibold text-white hover:bg-mag-red-dark">
              <i className="fas fa-file-excel" aria-hidden /> Exporter {selected} (Excel)
            </a>
          )}
        </form>
        {communeParam && !selected && <p className="mt-3 text-sm text-red-700">Commune inconnue.</p>}
        {view && (
          <div className="mt-5 space-y-5 text-sm">
            <div>
              <h3 className="font-semibold text-mag-dark">Artisan·e·s ({view.artisans.length})</h3>
              {view.artisans.length === 0 ? (
                <p className="text-mag-gray">Aucune fiche publiée.</p>
              ) : (
                <table className="mt-2 w-full">
                  <thead className="text-left text-mag-dark/80">
                    <tr>
                      <th className="py-1.5 pr-4">Nom</th>
                      <th className="py-1.5 pr-4">Métier</th>
                      <th className="py-1.5 pr-4">Domaine</th>
                      <th className="py-1.5 pr-4">Dossier</th>
                      <th className="py-1.5">Intégration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mag-cream/60">
                    {view.artisans.map((a) => (
                      <tr key={a.slug}>
                        <td className="py-1.5 pr-4">
                          <a href={`/artisans/${a.slug}`} target="_blank" rel="noreferrer" className="text-mag-dark hover:text-mag-red">{a.name}</a>
                        </td>
                        <td className="py-1.5 pr-4 text-mag-dark/70">{a.craft ?? "—"}</td>
                        <td className="py-1.5 pr-4 text-mag-dark/70">{a.categoryName ?? "—"}</td>
                        <td className="py-1.5 pr-4 text-mag-dark/70">{DOSSIER_STATUSES.find((s) => s.value === a.status)?.label ?? "aucun"}</td>
                        <td className="py-1.5 text-mag-dark/70">{formatDay(a.integratedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {(
              [
                ["Écoles formatrices", view.ecoles],
                ["Institutions culturelles", view.institutions],
                ["Associations professionnelles", view.associations],
                ["Partenaires", view.partenaires],
              ] as const
            ).map(([label, items]) => (
              <div key={label}>
                <h3 className="font-semibold text-mag-dark">
                  {label} ({items.length})
                </h3>
                <p className="text-mag-dark/70">{items.length ? items.map((i) => i.name).join(", ") : "—"}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
