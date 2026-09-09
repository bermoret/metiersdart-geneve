"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";

type Artisan = {
  id: string;
  name: string;
  slug: string;
  type: string;
  craft: string | null;
  commune: string | null;
  published: boolean;
  categoryName: string | null;
};

export default function AdminArtisansPage() {
  const [rows, setRows] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/artisans")
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-mag-gray">Chargement…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-6">
        Artisans ({rows.length})
      </h1>
      <AdminTable
        columns={[
          { key: "name", label: "Nom" },
          { key: "craft", label: "Métier" },
          { key: "categoryName", label: "Domaine" },
          { key: "commune", label: "Commune" },
          { key: "type", label: "Type" },
          {
            key: "published",
            label: "Statut",
            render: (row) =>
              row.published ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <i className="fas fa-check-circle" /> Publié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-mag-gray">
                  <i className="fas fa-circle" /> Brouillon
                </span>
              ),
          },
        ]}
        rows={rows}
        onEdit={() => alert("Édition — à implémenter avec un formulaire modal")}
        onAdd={() => alert("Ajout — à implémenter")}
        addLabel="Nouvel artisan"
      />
    </div>
  );
}
