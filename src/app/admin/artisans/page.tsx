"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";
import { ArtisanModal } from "@/components/admin/ArtisanModal";

type Artisan = {
  id: string;
  name: string;
  slug: string;
  type: string;
  craft: string | null;
  commune: string | null;
  published: boolean | null;
  categoryName: string | null;
  categoryId: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  imageUrl: string | null;
};

type Category = {
  id: string;
  name: string;
};

export default function AdminArtisansPage() {
  const [rows, setRows] = useState<Artisan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Artisan | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch("/api/admin/artisans").then((r) => r.json()),
      fetch("/api/admin/categories").then((r) => r.json()),
    ]).then(([artisansData, catsData]) => {
      setRows(artisansData);
      setCategories(catsData.map((c: Category) => ({ id: c.id, name: c.name })));
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (row: Artisan) => {
    setEditing(row);
    setIsNew(false);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setIsNew(true);
    setModalOpen(true);
  };

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
        onEdit={handleEdit}
        onAdd={handleAdd}
        addLabel="Nouvel artisan"
      />

      <ArtisanModal
        open={modalOpen}
        artisan={editing as Artisan & { latitude?: string; longitude?: string } | null}
        categories={categories}
        isNew={isNew}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
