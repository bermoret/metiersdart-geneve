"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";
import { CategoryModal } from "@/components/admin/CategoryModal";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sortOrder: number | null;
  description: string | null;
};

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadData = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (row: Record<string, unknown>) => {
    setEditing(row as Category);
    setIsNew(false);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setIsNew(true);
    setModalOpen(true);
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const name = (row.name as string) ?? "cette catégorie";
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Erreur lors de la suppression");
        return;
      }
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur inconnue");
    }
  };

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
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Nouvelle catégorie"
      />

      <CategoryModal
        open={modalOpen}
        category={editing as Record<string, unknown> | null}
        isNew={isNew}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
