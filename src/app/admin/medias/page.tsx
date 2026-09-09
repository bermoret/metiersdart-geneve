"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";
import { MediaModal } from "@/components/admin/MediaModal";

type Media = {
  id: string;
  title: string;
  type: string | null;
  mediaType: string | null;
  source: string | null;
  createdAt: string;
};

type Category = { id: string; name: string };

export default function AdminMediasPage() {
  const [rows, setRows] = useState<Media[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch("/api/admin/medias").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([mediasData, catsData]) => {
      setRows(mediasData);
      setCategories(catsData.map((c: Category) => ({ id: c.id, name: c.name })));
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (row: Record<string, unknown>) => {
    setEditing(row as Media);
    setIsNew(false);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setIsNew(true);
    setModalOpen(true);
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const name = (row.title as string) ?? "ce média";
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/admin/medias/${row.id}`, { method: "DELETE" });
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
        Médias ({rows.length})
      </h1>
      <AdminTable
        columns={[
          { key: "title", label: "Titre" },
          { key: "type", label: "Type" },
          { key: "mediaType", label: "Plateforme" },
          { key: "source", label: "Source" },
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
        addLabel="Nouveau média"
      />

      <MediaModal
        open={modalOpen}
        media={editing as Record<string, unknown> | null}
        categories={categories}
        isNew={isNew}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
