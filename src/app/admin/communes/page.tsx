"use client";

import { useState, useEffect } from "react";

type Commune = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  soutientMag: boolean;
};

export default function AdminCommunesPage() {
  const [rows, setRows] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadData = () => {
    fetch("/api/admin/communes")
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSoutien = async (commune: Commune) => {
    setSaving(commune.id);
    try {
      const res = await fetch(`/api/admin/communes/${commune.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soutientMag: !commune.soutientMag }),
      });
      if (!res.ok) throw new Error("Erreur");
      loadData();
    } catch {
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-mag-gray">Chargement…</p>;

  const soutenants = rows.filter((c) => c.soutientMag).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-2">
        Communes ({rows.length})
      </h1>
      <p className="text-sm text-mag-gray mb-6">
        {soutenants} commune{soutenants > 1 ? "s" : ""} soutiennent MAG sur{" "}
        {rows.length} au total.
      </p>

      <div className="overflow-x-auto rounded-xl border border-mag-cream shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-mag-cream/50 text-mag-dark/80">
            <tr>
              <th className="px-4 py-3 font-semibold">Commune</th>
              <th className="px-4 py-3 font-semibold">Soutient MAG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mag-cream/60">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-mag-cream/20 transition-colors">
                <td className="px-4 py-3 font-medium text-mag-dark">{c.name}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSoutien(c)}
                    disabled={saving === c.id}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      c.soutientMag
                        ? "bg-mag-red text-white hover:bg-mag-red/90"
                        : "bg-mag-cream text-mag-gray hover:bg-mag-cream/70"
                    }`}
                  >
                    {saving === c.id ? (
                      "…"
                    ) : c.soutientMag ? (
                      <>
                        <i className="fas fa-check" /> Oui
                      </>
                    ) : (
                      "Non"
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <p className="text-center text-mag-gray py-12">
          Aucune commune en base. Lancez le seed pour initialiser les 45 communes genevoises.
        </p>
      )}
    </div>
  );
}
