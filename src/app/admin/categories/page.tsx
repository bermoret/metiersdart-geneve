"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sortOrder: number | null;
};

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/categories")
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
        Catégories ({rows.length})
      </h1>
      <AdminTable
        columns={[
          { key: "name", label: "Nom" },
          { key: "slug", label: "Slug" },
          {
            key: "icon",
            label: "Icône",
            render: (row) =>
              row.icon ? (
                <span className="inline-flex items-center gap-1.5">
                  <i className={String(row.icon)} /> {String(row.icon)}
                </span>
              ) : (
                ""
              ),
          },
          {
            key: "color",
            label: "Couleur",
            render: (row) =>
              row.color ? (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-4 h-4 rounded-full"
                    style={{ backgroundColor: String(row.color) }}
                  />
                  {String(row.color)}
                </span>
              ) : (
                ""
              ),
          },
          { key: "sortOrder", label: "Ordre" },
        ]}
        rows={rows}
        onEdit={() => alert("Édition — à implémenter")}
        onAdd={() => alert("Ajout — à implémenter")}
        addLabel="Nouvelle catégorie"
      />
    </div>
  );
}
