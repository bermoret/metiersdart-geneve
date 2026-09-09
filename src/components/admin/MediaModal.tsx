"use client";

import { useState } from "react";

type MediaData = {
  id?: string;
  title: string;
  type: string;
  mediaType: string;
  categoryId: string;
  videoUrl: string;
  externalUrl: string;
  pdfUrl: string;
  date: string;
  source: string;
  description: string;
  sortOrder: string;
};

type Category = { id: string; name: string };

type Props = {
  open: boolean;
  media: Record<string, unknown> | null;
  categories: Category[];
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const MEDIA_TYPES = [
  { value: "video", label: "Capsule vidéo" },
  { value: "presse", label: "Revue de presse" },
  { value: "article", label: "Article / lien externe" },
];

const PLATFORM_TYPES = [
  { value: "", label: "— Aucune —" },
  { value: "vimeo", label: "Vimeo" },
  { value: "youtube", label: "YouTube" },
];

const EMPTY: MediaData = {
  title: "",
  type: "video",
  mediaType: "",
  categoryId: "",
  videoUrl: "",
  externalUrl: "",
  pdfUrl: "",
  date: "",
  source: "",
  description: "",
  sortOrder: "0",
};

export function MediaModal({ open, media, categories, isNew, onClose, onSaved }: Props) {
  const [form, setForm] = useState<MediaData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formKey = (media?.id as string) ?? "new";
  const [lastFormKey, setLastFormKey] = useState("");

  if (open && formKey !== lastFormKey) {
    setLastFormKey(formKey);
    const m = media as Record<string, unknown> | null;
    setForm(
      m
        ? {
            ...EMPTY,
            ...m,
            date: m.date ? new Date(m.date as string).toISOString().slice(0, 10) : "",
            sortOrder: m.sortOrder != null ? String(m.sortOrder) : "0",
          } as MediaData
        : EMPTY,
    );
    setError(null);
  }

  if (!open) return null;

  const update = (key: keyof MediaData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        mediaType: form.mediaType || undefined,
        categoryId: form.categoryId || undefined,
        videoUrl: form.videoUrl || undefined,
        externalUrl: form.externalUrl || undefined,
        pdfUrl: form.pdfUrl || undefined,
        date: form.date || undefined,
        source: form.source || undefined,
        description: form.description || undefined,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
      };
      const url = isNew ? "/api/admin/medias" : `/api/admin/medias/${form.id}`;
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
      const res = await fetch(`/api/admin/medias/${form.id}`, { method: "DELETE" });
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
            {isNew ? "Nouveau média" : `Modifier — ${form.title}`}
          </h2>
          <button onClick={onClose} className="text-mag-gray hover:text-mag-dark transition-colors" aria-label="Fermer">
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Titre *" value={form.title} onChange={(v) => update("title", v)} fullWidth />

          <SelectField label="Type de média" value={form.type} onChange={(v) => update("type", v)} options={MEDIA_TYPES} />
          <SelectField
            label="Plateforme vidéo"
            value={form.mediaType}
            onChange={(v) => update("mediaType", v)}
            options={PLATFORM_TYPES}
          />

          <SelectField
            label="Domaine (catégorie)"
            value={form.categoryId}
            onChange={(v) => update("categoryId", v)}
            options={[{ value: "", label: "— Aucun —" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <Field label="Source / Auteur" value={form.source} onChange={(v) => update("source", v)} placeholder="Art du bois, Léman Bleu…" />

          {/* Champs conditionnels selon le type */}
          {form.type === "video" && (
            <Field label="URL vidéo (Vimeo / YouTube)" value={form.videoUrl} onChange={(v) => update("videoUrl", v)} fullWidth placeholder="https://vimeo.com/… ou https://www.youtube.com/watch?v=…" />
          )}
          {form.type === "article" && (
            <Field label="URL externe" value={form.externalUrl} onChange={(v) => update("externalUrl", v)} fullWidth placeholder="https://…" />
          )}
          {form.type === "presse" && (
            <Field label="URL du PDF" value={form.pdfUrl} onChange={(v) => update("pdfUrl", v)} fullWidth placeholder="https://…/revue.pdf" />
          )}

          <Field label="Date" value={form.date} onChange={(v) => update("date", v)} type="date" />
          <Field label="Ordre de tri" value={form.sortOrder} onChange={(v) => update("sortOrder", v)} type="number" />

          <TextareaField label="Description" value={form.description} onChange={(v) => update("description", v)} rows={3} fullWidth />
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

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label>
      <span className="text-xs font-medium text-mag-gray mb-1 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-mag-cream bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none"
      >
        {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
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
