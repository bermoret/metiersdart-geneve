"use client";

import { useState, useEffect } from "react";

type Annonce = {
  id: string;
  title: string;
  category: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  published: { label: "Publiée", color: "bg-green-100 text-green-700" },
  rejected: { label: "Refusée", color: "bg-red-100 text-red-700" },
};

export default function AdminAnnoncesPage() {
  const [rows, setRows] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const loadData = () => {
    setLoading(true);
    fetch(`/api/admin/annonces?status=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleAction = async (id: string, status: "published" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/annonces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur");
      loadData();
    } catch {
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette annonce ?")) return;
    try {
      const res = await fetch(`/api/admin/annonces/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      loadData();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-2">
        Annonces Communauté
      </h1>
      <p className="text-sm text-mag-gray mb-6">
        Modération des petites annonces de l&apos;espace Communauté.
      </p>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {(["pending", "published", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              filter === s
                ? "bg-mag-red text-white"
                : "bg-mag-cream text-mag-dark hover:bg-mag-cream/70"
            }`}
          >
            {STATUS_LABELS[s].label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-mag-gray">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-mag-gray py-12">
          Aucune annonce {filter === "pending" ? "en attente" : filter === "published" ? "publiée" : "refusée"}.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((a) => (
            <div key={a.id} className="rounded-xl border border-mag-cream bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[a.status]?.color ?? ""}`}>
                      {STATUS_LABELS[a.status]?.label ?? a.status}
                    </span>
                    <span className="inline-block rounded-full bg-mag-cream/60 px-2.5 py-0.5 text-xs text-mag-dark/70">
                      {a.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-mag-dark">{a.title}</h3>
                  <p className="mt-1 text-sm text-mag-dark/70 whitespace-pre-line">{a.content}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-mag-gray">
                    <span>Par <strong>{a.authorName}</strong></span>
                    {a.authorEmail && <span>{a.authorEmail}</span>}
                    <span>{new Date(a.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {a.status !== "published" && (
                    <button
                      onClick={() => handleAction(a.id, "published")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                    >
                      <i className="fas fa-check" /> Publier
                    </button>
                  )}
                  {a.status !== "rejected" && (
                    <button
                      onClick={() => handleAction(a.id, "rejected")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      <i className="fas fa-times" /> Refuser
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-mag-gray hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <i className="fas fa-trash" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
