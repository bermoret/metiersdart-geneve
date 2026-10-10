"use client";

// Modération des annonces de l'Espace Communauté (LOT C) : publier / refuser /
// supprimer, modifier le texte (titre, catégorie, auteur, e-mail, contenu),
// remplacer ou retirer la photo.

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ANNONCE_CATEGORIES, ANNONCE_PHOTO_TYPES } from "@/lib/annonces";
import { downscaleImage } from "@/lib/image-resize";
import { canOptimizeImage } from "@/lib/utils";
import { formatDay } from "@/lib/dates";
import { ADMIN_INPUT_CLASS } from "@/components/admin/AdminTable";

type Annonce = {
  id: string;
  title: string;
  category: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  imageUrl: string | null;
  status: string;
  createdAt: string;
};

type Edit = Pick<Annonce, "title" | "category" | "authorName" | "content"> & { authorEmail: string };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  published: { label: "Publiée", color: "bg-green-100 text-green-700" },
  rejected: { label: "Refusée", color: "bg-red-100 text-red-700" },
};

export default function AdminAnnoncesPage() {
  const [rows, setRows] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [editing, setEditing] = useState<{ id: string; form: Edit } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const photoInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Recréée à chaque changement de filtre : l'effet ci-dessous recharge alors la liste.
  const loadData = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/annonces?status=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const patch = async (id: string, body: Record<string, unknown>, label: string) => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/annonces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${label} : erreur`);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} : erreur`);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleAction = async (id: string, status: "published" | "rejected") => {
    if (await patch(id, { status }, "Modération")) loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement cette annonce (et sa photo) ?")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/annonces/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setBusy(null);
    }
  };

  const startEdit = (a: Annonce) =>
    setEditing({ id: a.id, form: { title: a.title, category: a.category, authorName: a.authorName, authorEmail: a.authorEmail ?? "", content: a.content } });

  const saveEdit = async () => {
    if (!editing) return;
    if (await patch(editing.id, editing.form, "Modification")) {
      setEditing(null);
      loadData();
    }
  };

  const handlePhoto = async (id: string, file: File | undefined) => {
    if (!file) return;
    setBusy(id);
    setError(null);
    try {
      const reduced = await downscaleImage(file);
      if (!(reduced.type in ANNONCE_PHOTO_TYPES)) throw new Error("Format non pris en charge : JPEG, PNG ou WebP");
      const fd = new FormData();
      fd.append("photo", reduced.blob, reduced.name);
      const res = await fetch(`/api/admin/annonces/${id}/photo`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Envoi de la photo impossible");
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi de la photo impossible");
    } finally {
      setBusy(null);
      const input = photoInputs.current[id];
      if (input) input.value = "";
    }
  };

  const removePhoto = async (id: string) => {
    if (!confirm("Retirer la photo de cette annonce ?")) return;
    if (await patch(id, { imageUrl: null }, "Retrait de la photo")) loadData();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-mag-dark font-serif mb-2">Annonces Communauté</h1>
      <p className="text-sm text-mag-gray mb-6">
        Modération des petites annonces de l&apos;espace Communauté. Les annonces publiées s&apos;affichent de la plus récente à la plus ancienne.
      </p>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {(["pending", "published", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
              filter === s ? "bg-mag-red text-white" : "bg-mag-cream text-mag-dark hover:bg-mag-cream/70"
            }`}
          >
            {STATUS_LABELS[s].label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-mag-gray">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-mag-gray py-12">
          Aucune annonce {filter === "pending" ? "en attente" : filter === "published" ? "publiée" : "refusée"}.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((a) => {
            const isEditing = editing?.id === a.id;
            const disabled = busy === a.id;
            return (
              <div key={a.id} className="rounded-xl border border-mag-cream bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Photo */}
                  <div className="shrink-0 w-28">
                    {a.imageUrl ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-mag-cream/40">
                        <Image src={a.imageUrl} unoptimized={!canOptimizeImage(a.imageUrl)} alt="" fill sizes="112px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-mag-cream text-mag-gray">
                        <i className="fas fa-image" aria-hidden />
                      </div>
                    )}
                    <input
                      ref={(el) => {
                        photoInputs.current[a.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handlePhoto(a.id, e.target.files?.[0])}
                    />
                    <div className="mt-1 flex flex-wrap gap-x-2 text-xs">
                      <button type="button" disabled={disabled} onClick={() => photoInputs.current[a.id]?.click()} className="text-mag-red hover:underline disabled:opacity-50 cursor-pointer">
                        {a.imageUrl ? "Remplacer" : "Ajouter une photo"}
                      </button>
                      {a.imageUrl && (
                        <button type="button" disabled={disabled} onClick={() => removePhoto(a.id)} className="text-mag-gray hover:text-red-700 disabled:opacity-50 cursor-pointer">
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contenu ou formulaire de modification */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[a.status]?.color ?? ""}`}>
                        {STATUS_LABELS[a.status]?.label ?? a.status}
                      </span>
                      {!isEditing && (
                        <span className="inline-block rounded-full bg-mag-cream/60 px-2.5 py-0.5 text-xs text-mag-dark/80">{a.category}</span>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="mb-1 block text-xs font-medium text-mag-gray">Titre</span>
                          <input type="text" value={editing.form.title} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, title: e.target.value } })} className={ADMIN_INPUT_CLASS} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-mag-gray">Catégorie</span>
                          <select value={editing.form.category} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, category: e.target.value } })} className={ADMIN_INPUT_CLASS}>
                            {!(ANNONCE_CATEGORIES as readonly string[]).includes(editing.form.category) && <option value={editing.form.category}>{editing.form.category} (hors liste)</option>}
                            {ANNONCE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-mag-gray">Auteur</span>
                          <input type="text" value={editing.form.authorName} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, authorName: e.target.value } })} className={ADMIN_INPUT_CLASS} />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="mb-1 block text-xs font-medium text-mag-gray">E-mail (facultatif)</span>
                          <input type="email" value={editing.form.authorEmail} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, authorEmail: e.target.value } })} className={ADMIN_INPUT_CLASS} />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="mb-1 block text-xs font-medium text-mag-gray">Contenu</span>
                          <textarea rows={6} value={editing.form.content} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, content: e.target.value } })} className={ADMIN_INPUT_CLASS} />
                        </label>
                        <div className="sm:col-span-2 flex items-center gap-3">
                          <button type="button" disabled={disabled} onClick={saveEdit} className="rounded-lg bg-mag-red px-4 py-2 text-sm font-semibold text-white hover:bg-mag-red-dark disabled:opacity-50 cursor-pointer">
                            Enregistrer
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className="text-sm text-mag-gray hover:text-mag-dark cursor-pointer">
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-mag-dark">{a.title}</h3>
                        <p className="mt-1 text-sm text-mag-dark/70 whitespace-pre-line">{a.content}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-mag-gray">
                          <span>
                            Par <strong>{a.authorName}</strong>
                          </span>
                          {a.authorEmail && <span>{a.authorEmail}</span>}
                          <span>{formatDay(a.createdAt)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex flex-col gap-2 shrink-0">
                      {a.status !== "published" && (
                        <button disabled={disabled} onClick={() => handleAction(a.id, "published")} className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 cursor-pointer">
                          <i className="fas fa-check" /> Publier
                        </button>
                      )}
                      {a.status !== "rejected" && (
                        <button disabled={disabled} onClick={() => handleAction(a.id, "rejected")} className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer">
                          <i className="fas fa-times" /> Refuser
                        </button>
                      )}
                      <button disabled={disabled} onClick={() => startEdit(a)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-mag-dark hover:text-mag-red transition-colors disabled:opacity-50 cursor-pointer">
                        <i className="fas fa-pen" /> Modifier
                      </button>
                      <button disabled={disabled} onClick={() => handleDelete(a.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-mag-gray hover:text-red-700 transition-colors disabled:opacity-50 cursor-pointer">
                        <i className="fas fa-trash" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
