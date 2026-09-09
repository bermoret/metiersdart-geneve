"use client";

import { useState, useMemo } from "react";
import { artisans, categories } from "@/lib/data";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function RepertoireTable() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [communeFilter, setCommuneFilter] = useState("");

  const communes = useMemo(
    () => [...new Set(artisans.map((a) => a.commune))].sort(),
    [],
  );

  const filtered = useMemo(() => {
    return artisans.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.name.toLowerCase().includes(q) &&
          !a.craft.toLowerCase().includes(q) &&
          !a.commune.toLowerCase().includes(q)
        )
          return false;
      }
      if (categoryFilter && a.categoryName !== categoryFilter) return false;
      if (communeFilter && a.commune !== communeFilter) return false;
      return true;
    });
  }, [search, categoryFilter, communeFilter]);

  return (
    <>
      {/* Barre de filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <label className="flex-1">
          <span className="sr-only">Rechercher</span>
          <input
            type="text"
            placeholder="Rechercher par nom, métier, commune…"
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
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrer par commune</span>
          <select
            value={communeFilter}
            onChange={(e) => setCommuneFilter(e.target.value)}
            className="rounded-lg border border-mag-cream bg-white px-4 py-2.5 text-sm focus:border-mag-red focus:outline-none"
          >
            <option value="">Toutes les communes</option>
            {communes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-4 text-sm text-mag-gray" aria-live="polite">
        {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
      </p>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-xl border border-mag-cream shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-mag-cream/50 text-mag-dark/80">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Nom</th>
              <th scope="col" className="px-4 py-3 font-semibold hidden sm:table-cell">Métier</th>
              <th scope="col" className="px-4 py-3 font-semibold hidden md:table-cell">Domaine</th>
              <th scope="col" className="px-4 py-3 font-semibold">Commune</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mag-cream/60">
            {filtered.map((a) => {
              const cat = categories.find((c) => c.name === a.categoryName);
              return (
                <tr key={a.id} className="hover:bg-mag-cream/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-mag-dark">
                    <a
                      href={`/artisans/${a.slug}`}
                      className="text-mag-dark hover:text-mag-red transition-colors"
                    >
                      {a.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-mag-dark/70 hidden sm:table-cell">
                    {a.craft}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {cat && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: (cat.color ?? "#999") + "20",
                          color: cat.color ?? "#999",
                        }}
                      >
                        <CategoryIcon icon={cat.icon} /> {a.categoryName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mag-dark/70">{a.commune}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-mag-gray py-12">
          Aucun résultat pour cette recherche.
        </p>
      )}
    </>
  );
}
