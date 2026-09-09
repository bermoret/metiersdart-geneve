"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";
import { JemaModal } from "@/components/admin/JemaModal";

type Jema = {
  id: string;
  year: number;
  title: string;
  isUpcoming: boolean | null;
  isPast: boolean | null;
};

export default function AdminJemaPage() {
  const [rows, setRows] = useState<Jema[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Jema | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadData = () => {
    fetch("/api/admin/jema")
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
    setEditing(row as Jema);
    setIsNew(false);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setIsNew(true);
    setModalOpen(true);
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const year = (row.year as number) ?? "cette édition";
    if (!confirm(`Supprimer l'édition ${year} ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/admin/jema/${row.id}`, { method: "DELETE" });
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
        Éditions JEMA ({rows.length})
      </h1>
      <AdminTable
        columns={[
          { key: "year", label: "Année" },
          { key: "title", label: "Titre" },
          {
            key: "isUpcoming",
            label: "À venir",
            render: (row) =>
              row.isUpcoming ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <i className="fas fa-check-circle" /> Oui
                </span>
              ) : (
                <span className="text-xs text-mag-gray">Non</span>
              ),
          },
          {
            key: "isPast",
            label: "Passée",
            render: (row) =>
              row.isPast ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                  <i className="fas fa-check-circle" /> Oui
                </span>
              ) : (
                <span className="text-xs text-mag-gray">Non</span>
              ),
          },
        ]}
        rows={rows}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Nouvelle édition"
      />

      <JemaModal
        open={modalOpen}
        edition={editing as Record<string, unknown> | null}
        isNew={isNew}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
