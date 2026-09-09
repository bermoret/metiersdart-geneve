"use client";

import { useState, useEffect } from "react";
import { AdminTable } from "@/components/admin/AdminTable";

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

  useEffect(() => {
    fetch("/api/admin/jema")
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
        onEdit={() => alert("Édition — à implémenter")}
        onAdd={() => alert("Ajout — à implémenter")}
        addLabel="Nouvelle édition"
      />
    </div>
  );
}
