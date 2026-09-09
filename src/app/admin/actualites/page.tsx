"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";

type Actu = {
  id: string;
  title: string;
  category: string | null;
  published: boolean | null;
  createdAt: string;
};

export default function AdminActualitesPage() {
  const [rows, setRows] = useState<Actu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/actualites")
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
        Actualités ({rows.length})
      </h1>
      <AdminTable
        columns={[
          { key: "title", label: "Titre" },
          { key: "category", label: "Catégorie" },
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
          {
            key: "createdAt",
            label: "Créé le",
            render: (row) =>
              row.createdAt
                ? new Date(String(row.createdAt)).toLocaleDateString("fr-FR")
                : "",
          },
        ]}
        rows={rows}
        onEdit={() => alert("Édition — à implémenter")}
        onAdd={() => alert("Ajout — à implémenter")}
        addLabel="Nouvelle actualité"
      />
    </div>
  );
}
