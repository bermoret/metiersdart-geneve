"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";
import { MediaModal } from "@/components/admin/MediaModal";
import { mediaTypeLabel } from "@/lib/actu-medias";

type Media = {
  id: string;
  title: string;
  type: string | null;
  source: string | null;
  published: boolean | null;
  createdAt: string;
};

export default function AdminMediasPage() {
  const [rows, setRows] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Media | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadData = () => {
    fetch("/api/admin/medias")
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
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-2">
        Médias ({rows.length})
      </h1>
      <p className="text-sm text-mag-gray mb-6">
        Page Médias : capsules vidéo, « On parle des métiers d&apos;art » (vidéos et liens),
        revue de presse JEMA et articles archivés. La section dépend du type choisi.
      </p>
      <AdminTable
        columns={[
          { key: "title", label: "Titre" },
          { key: "type", label: "Section", render: (row) => mediaTypeLabel(String(row.type ?? "")) },
          { key: "source", label: "Sous-titre" },
          {
            key: "published",
            label: "Statut",
            // Comme le site (getMedias : published = true) : NULL n'est pas publié.
            render: (row) =>
              row.published === true ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-700">
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
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        addLabel="Nouveau média"
      />

      <MediaModal
        open={modalOpen}
        media={editing as Record<string, unknown> | null}
        isNew={isNew}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
