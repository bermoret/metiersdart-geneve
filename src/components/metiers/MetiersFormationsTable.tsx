"use client";

import { useState, useMemo } from "react";

export type MetierFormation = {
  metier: string;
  definition: string;
  formations: string[];
  category?: string;
};

export function MetiersFormationsTable({
  data,
}: {
  data: MetierFormation[];
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categoriesList = useMemo(
    () =>
      [...new Set(data.map((m) => m.category).filter(Boolean))].sort() as string[],
    [data],
  );

  const filtered = useMemo(() => {
    return data.filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !m.metier.toLowerCase().includes(q) &&
          !m.definition.toLowerCase().includes(q)
        )
          return false;
      }
      if (categoryFilter && m.category !== categoryFilter) return false;
      return true;
    });
  }, [data, search, categoryFilter]);

  return (
    <>
      {/* Filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <label className="flex-1">
          <span className="sr-only">Rechercher un métier</span>
          <input
            type="text"
            placeholder="Rechercher un métier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-mag-cream bg-white px-4 py-2.5 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
          />
        </label>
        <label>
          <span className="sr-only">Filtrer par domaine</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-mag-cream bg-white px-4 py-2.5 text-sm focus:border-mag-red focus:outline-none"
          >
            <option value="">Tous les domaines</option>
            {categoriesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-4 text-sm text-mag-gray" aria-live="polite">
        {filtered.length} métier{filtered.length > 1 ? "s" : ""}
      </p>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-xl border border-mag-cream shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-mag-cream/50 text-mag-dark/80">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold min-w-[180px]">Métier</th>
              <th scope="col" className="px-4 py-3 font-semibold">Définition</th>
              <th scope="col" className="px-4 py-3 font-semibold min-w-[200px]">Formations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mag-cream/60">
            {filtered.map((m, i) => (
              <tr key={i} className="hover:bg-mag-cream/20 transition-colors align-top">
                <td className="px-4 py-4 font-medium text-mag-dark">
                  {m.metier}
                  {m.category && (
                    <span className="block mt-1 text-xs text-mag-gray">{m.category}</span>
                  )}
                </td>
                <td className="px-4 py-4 text-mag-dark/70 leading-relaxed">
                  {m.definition}
                </td>
                <td className="px-4 py-4">
                  <ul className="space-y-1">
                    {m.formations.map((f, j) => (
                      <li
                        key={j}
                        className="text-xs text-mag-dark/80 flex items-start gap-1.5"
                      >
                        <span className="text-mag-red mt-0.5" aria-hidden>▸</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-mag-gray py-12">
          Aucun métier ne correspond à votre recherche.
        </p>
      )}

      <p className="mt-8 text-xs text-mag-gray italic">
        Page mise à jour le 8 janvier 2026. Source : INMA / orientation.ch / OFPC.
      </p>
    </>
  );
}
