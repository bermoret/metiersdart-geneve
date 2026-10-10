"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DOSSIER_STATUSES, type DossierStatus } from "@/lib/dossier-fields";
import { composePublicName } from "@/lib/dossier-rules";
import { formatDay as day } from "@/lib/dates";

type Row = {
  id: string;
  status: DossierStatus;
  firstName: string | null;
  lastName: string | null;
  workshopName: string | null;
  craft: string | null;
  commune: string | null;
  integratedAt: string | null;
  deactivatedAt: string | null;
  updatedAt: string;
  artisanId: string | null;
  categoryName: string | null;
  artisanName: string | null;
  artisanSlug: string | null;
  artisanPublished: boolean | null;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DossierStatus | "tous">("en_evaluation");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/admin/dossiers")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Row[]) => setRows(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur inconnue"))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { tous: rows.length };
    for (const s of DOSSIER_STATUSES) c[s.value] = rows.filter((r) => r.status === s.value).length;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const needle = fold(q.trim());
    return rows.filter((r) => {
      if (filter !== "tous" && r.status !== filter) return false;
      if (!needle) return true;
      const hay = fold([r.lastName, r.firstName, r.workshopName, r.artisanName, r.craft, r.commune].filter(Boolean).join(" "));
      return hay.includes(needle);
    });
  }, [rows, filter, q]);

  const handleNew = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/dossiers", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Création impossible");
      router.push(`/admin/onboarding/${data.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur inconnue");
      setCreating(false);
    }
  };

  if (loading) return <p className="text-mag-gray">Chargement…</p>;
  if (error) return <p className="text-mag-red">Impossible de charger les dossiers ({error}). Rechargez la page.</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mag-dark font-serif">Onboarding des artisans</h1>
          <p className="mt-1 text-sm text-mag-gray">
            Formulaire d’éligibilité, pièces justificatives et suivi. Le dossier précède la fiche publique.
          </p>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-lg bg-mag-red px-4 py-2 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors disabled:opacity-50 cursor-pointer"
        >
          <i className="fas fa-plus" aria-hidden />
          {creating ? "Création…" : "Nouveau dossier"}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ value: "tous" as const, label: "Tous" }, ...DOSSIER_STATUSES].map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`rounded-full px-3 py-1 text-sm transition-colors cursor-pointer ${
              filter === s.value ? "bg-mag-red text-white" : "bg-white border border-mag-cream text-mag-dark hover:border-mag-red"
            }`}
          >
            {s.label} <span className="opacity-70">({counts[s.value] ?? 0})</span>
          </button>
        ))}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, atelier, métier, commune)"
          className="ml-auto w-72 rounded-lg border border-mag-field bg-white px-3 py-1.5 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-mag-cream shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-mag-cream/50 text-mag-dark/80">
            <tr>
              {["Artisan·e", "Métier", "Domaine", "Commune", "Statut", "Fiche publique", "Intégration", "Modifié"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-mag-cream/60">
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-mag-gray">Aucun dossier.</td>
              </tr>
            )}
            {visible.map((r) => {
              const status = DOSSIER_STATUSES.find((s) => s.value === r.status)!;
              const name = composePublicName(r) || r.artisanName || "(sans nom)";
              return (
                <tr key={r.id} className="hover:bg-mag-cream/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/onboarding/${r.id}`} className="font-medium text-mag-dark hover:text-mag-red">
                      {name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mag-dark/70">{r.craft ?? "—"}</td>
                  <td className="px-4 py-3 text-mag-dark/70">{r.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 text-mag-dark/70">{r.commune ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-mag-dark/70">
                    {r.artisanId ? (
                      r.artisanPublished && r.artisanSlug ? (
                        <a href={`/artisans/${r.artisanSlug}`} target="_blank" rel="noreferrer" className="text-mag-red hover:underline">
                          publiée ↗
                        </a>
                      ) : (
                        "non publiée"
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-mag-dark/70 whitespace-nowrap">{day(r.integratedAt)}</td>
                  <td className="px-4 py-3 text-mag-dark/70 whitespace-nowrap">{day(r.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
