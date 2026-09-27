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
  const [communes, setCommunes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [communesError, setCommunesError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Artisan | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadData = () => {
    const json = (url: string) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
        return r.json();
      });
    // Les communes ne servent qu'au menu de la fiche : leur échec n'empêche pas
    // d'afficher les artisans (la fiche passe en saisie libre).
    const communesReq = json("/api/admin/communes")
      .then((data: { name: string }[]) => {
        setCommunesError(false);
        return data.map((c) => c.name);
      })
      .catch(() => {
        setCommunesError(true);
        return [] as string[];
      });
    Promise.all([json("/api/admin/artisans"), json("/api/admin/categories"), communesReq])
      .then(([artisansData, catsData, communesData]) => {
        setRows(artisansData);
        setCategories(catsData.map((c: Category) => ({ id: c.id, name: c.name })));
        setCommunes(communesData);
        setLoadError(null);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Erreur inconnue"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (row: Record<string, unknown>) => {
    setEditing(row as Artisan);
    setIsNew(false);
    setModalOpen(true);
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const name = (row.name as string) ?? "cet artisan";
    if (!confirm(`Supprimer "${name}" ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/admin/artisans/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur inconnue");
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setIsNew(true);
    setModalOpen(true);
  };

  if (loading) return <p className="text-mag-gray">Chargement…</p>;
  if (loadError) {
    return (
      <p className="text-mag-red">
        Impossible de charger les artisans ({loadError}). Rechargez la page.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-6">
        Artisans ({rows.length})
      </h1>
      {communesError && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Liste des communes indisponible : la commune se saisit à la main dans la fiche.
        </p>
      )}
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
        addLabel="Nouvel artisan"
      />

      <ArtisanModal
        open={modalOpen}
        artisan={editing as Record<string, unknown> | null}
        categories={categories}
        communes={communes}
        isNew={isNew}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
}
