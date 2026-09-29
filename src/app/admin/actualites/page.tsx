"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";
import { ActuModal } from "@/components/admin/ActuModal";
import { formatActuDate, isActuPast } from "@/lib/actu-medias";

type Actu = {
  id: string;
  title: string;
  category: string | null;
  eventDate: string | null;
  eventEndDate: string | null;
  published: boolean | null;
  isArchived: boolean | null;
  createdAt: string;
};

const toDate = (v: unknown) => (typeof v === "string" && v ? new Date(v) : null);

/** État de la carte sur le site : publiée, passée (date dépassée), archivée ou brouillon. */
function Status({ row }: { row: Record<string, unknown> }) {
  if (!row.published) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-mag-gray">
        <i className="fas fa-circle" /> Brouillon
      </span>
    );
  }
  if (row.isArchived) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-mag-gray">
        <i className="fas fa-box-archive" /> Archivée
      </span>
    );
  }
  if (isActuPast({ eventDate: toDate(row.eventDate), eventEndDate: toDate(row.eventEndDate) })) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700" title="Date dépassée : n'apparaît plus sur le site">
        <i className="fas fa-clock" /> Passée
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-700">
      <i className="fas fa-check-circle" /> Publiée
    </span>
  );
}

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
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-2">
        Actualités ({rows.length})
      </h1>
      <p className="text-sm text-mag-gray mb-6">
        Cartes de la page L&apos;actu : d&apos;abord celles sans date, puis les événements par date.
        Un événement dont la date est passée n&apos;apparaît plus sur le site.
      </p>
      <AdminTable
        columns={[
          { key: "title", label: "Titre" },
          { key: "category", label: "Étiquette" },
          {
            key: "eventDate",
            label: "Date",
            render: (row) => formatActuDate(toDate(row.eventDate), toDate(row.eventEndDate)) || "—",
          },
          { key: "published", label: "Statut", render: (row) => <Status row={row} /> },
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
