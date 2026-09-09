"use client";

import { useState, useRef } from "react";

type ActuData = {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  eventDate: string;
  eventEndDate: string;
  linkUrl: string;
  imageUrl: string;
  published: boolean;
  isArchived: boolean;
};

type Props = {
  open: boolean;
  actu: Record<string, unknown> | null;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY: ActuData = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  eventDate: "",
  eventEndDate: "",
  linkUrl: "",
  imageUrl: "",
  published: true,
  isArchived: false,
};

export function ActuModal({ open, actu, isNew, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ActuData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formKey = (actu?.id as string) ?? "new";
  const [lastFormKey, setLastFormKey] = useState("");

  if (open && formKey !== lastFormKey) {
    setLastFormKey(formKey);
    const a = actu as Record<string, unknown> | null;
    setForm(
      a
        ? {
            ...EMPTY,
            ...a,
            eventDate: a.eventDate ? new Date(a.eventDate as string).toISOString().slice(0, 10) : "",
            eventEndDate: a.eventEndDate ? new Date(a.eventEndDate as string).toISOString().slice(0, 10) : "",
          } as ActuData
        : EMPTY,
    );
    setError(null);
  }

  if (!open) return null;

  const update = (key: keyof ActuData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Erreur lors de l'upload");
      const data = await res.json();
      update("imageUrl", data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        eventDate: form.eventDate || undefined,
        eventEndDate: form.eventEndDate || undefined,
        linkUrl: form.linkUrl || undefined,
        imageUrl: form.imageUrl || undefined,
        excerpt: form.excerpt || undefined,
        content: form.content || undefined,
        category: form.category || undefined,
      };
      const url = isNew ? "/api/admin/actualites" : `/api/admin/actualites/${form.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la sauvegarde");
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (!confirm(`Supprimer "${form.title}" ? Cette action est irréversible.`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/actualites/${form.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la suppression");
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-mag-dark font-serif">
            {isNew ? "Nouvelle actualité" : `Modifier — ${form.title}`}
          </h2>
          <button onClick={onClose} className="text-mag-gray hover:text-mag-dark transition-colors" aria-label="Fermer">
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Titre *" value={form.title} onChange={(v) => update("title", v)} fullWidth />
          <Field label="Catégorie / Source" value={form.category} onChange={(v) => update("category", v)} placeholder="En ce moment, ACG, MAG…" />

          <Field label="Date d'événement" value={form.eventDate} onChange={(v) => update("eventDate", v)} type="date" />
          <Field label="Date de fin" value={form.eventEndDate} onChange={(v) => update("eventEndDate", v)} type="date" />

          <Field label="Lien" value={form.linkUrl} onChange={(v) => update("linkUrl", v)} fullWidth placeholder="https://…" />

          {/* Upload image */}
          <div className="col-span-2">
            <span className="text-xs font-medium text-mag-gray mb-1 block">Image</span>
            <div className="flex items-start gap-4">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Aperçu" className="w-24 h-24 rounded-lg object-cover border border-mag-cream shrink-0" />
              )}
              <div className="flex flex-col gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-lg border border-mag-cream px-4 py-2 text-sm font-medium text-mag-dark hover:border-mag-red hover:text-mag-red transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-mag-gray/30 border-t-mag-red rounded-full animate-spin" />
                      Upload…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload" />
                      {form.imageUrl ? "Changer l'image" : "Importer une image"}
                    </>
                  )}
                </button>
                {form.imageUrl && (
                  <button type="button" onClick={() => update("imageUrl", "")} className="text-xs text-mag-gray hover:text-red-500 transition-colors">
                    Retirer l&apos;image
                  </button>
                )}
              </div>
            </div>
          </div>

          <TextareaField label="Extrait / description courte" value={form.excerpt} onChange={(v) => update("excerpt", v)} rows={3} fullWidth />
          <TextareaField label="Contenu complet" value={form.content} onChange={(v) => update("content", v)} rows={5} fullWidth />

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.published} onChange={(e) => update("published", e.target.checked)} className="rounded border-mag-cream text-mag-red focus:ring-mag-red/20" />
            <span className="text-sm text-mag-dark">Publié</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isArchived} onChange={(e) => update("isArchived", e.target.checked)} className="rounded border-mag-cream text-mag-red focus:ring-mag-red/20" />
            <span className="text-sm text-mag-dark">Archivé</span>
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          {!isNew && (
            <button onClick={handleDelete} disabled={saving} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
              <i className="fas fa-trash" /> Supprimer
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-medium text-mag-gray hover:text-mag-dark transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !(form.title ?? "").trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-mag-red px-5 py-2 text-sm font-semibold text-white hover:bg-mag-red-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Enregistrement…
                </>
              ) : (
                <>
                  <i className="fas fa-check" /> Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, fullWidth }: {
  label: string; value: string | null; onChange: (v: string) => void; type?: string; placeholder?: string; fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? "col-span-2" : ""}>
      <span className="text-xs font-medium text-mag-gray mb-1 block">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-mag-cream bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, rows = 3, fullWidth }: {
  label: string; value: string | null; onChange: (v: string) => void; rows?: number; fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? "col-span-2" : ""}>
      <span className="text-xs font-medium text-mag-gray mb-1 block">{label}</span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-mag-cream bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
      />
    </label>
  );
}
