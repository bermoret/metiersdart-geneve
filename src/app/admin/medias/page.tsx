"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";

type Media = {
  id: string;
  title: string;
  type: string | null;
  mediaType: string | null;
  source: string | null;
  createdAt: string;
};

export default function AdminMediasPage() {
  const [rows, setRows] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/medias")
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
        Médias ({rows.length})
      </h1>
      <AdminTable
        columns={[
          { key: "title", label: "Titre" },
          { key: "type", label: "Type" },
          { key: "mediaType", label: "Média" },
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
        onEdit={() => alert("Édition — à implémenter")}
        onAdd={() => alert("Ajout — à implémenter")}
        addLabel="Nouveau média"
      />
    </div>
  );
}
