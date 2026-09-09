"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";
import { ActuModal } from "@/components/admin/ActuModal";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Actu | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadData = () => {
    fetch("/api/admin/actualites")
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
    setEditing(row as Actu);
    setIsNew(false);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setIsNew(true);
    setModalOpen(true);
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const name = (row.title as string) ?? "cette actualité";
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/admin/actualites/${row.id}`, { method: "DELETE" });
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
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Nouvelle actualité"
      />

      <ActuModal
        open={modalOpen}
        actu={editing as Record<string, unknown> | null}
        isNew={isNew}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
