"use client";

import { useState, useRef, useEffect } from "react";

// Formulaire d'une carte de /l-actu : chaque champ correspond à un élément de
// la carte (voir src/lib/actu-medias.ts). Tous les champs sont envoyés, une
// chaîne vide vidant la colonne ; la validation est côté serveur
// (src/lib/actu-medias-input.ts).

type ActuData = {
  id?: string;
  title: string;
  category: string;
  source: string;
  subtitle: string;
  excerpt: string;
  eventDate: string;
  eventEndDate: string;
  timeLabel: string;
  linkUrl: string;
  linkLabel: string;
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
  category: "",
  source: "",
  subtitle: "",
  excerpt: "",
  eventDate: "",
  eventEndDate: "",
  timeLabel: "",
  linkUrl: "",
  linkLabel: "",
  imageUrl: "",
  published: true,
  isArchived: false,
};

const str = (v: unknown) => (typeof v === "string" ? v : "");
const day = (v: unknown) => (typeof v === "string" && v ? new Date(v).toISOString().slice(0, 10) : "");

export function ActuModal({ open, actu, isNew, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ActuData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens / data changes
  const formKey = (actu?.id as string) ?? "new";
  useEffect(() => {
    if (!open) return;
    const a = actu;
    setForm(
      a
        ? {
            id: str(a.id),
            title: str(a.title),
            category: str(a.category),
            source: str(a.source),
            subtitle: str(a.subtitle),
            excerpt: str(a.excerpt),
            eventDate: day(a.eventDate),
            eventEndDate: day(a.eventEndDate),
            timeLabel: str(a.timeLabel),
            linkUrl: str(a.linkUrl),
            linkLabel: str(a.linkLabel),
            imageUrl: str(a.imageUrl),
            published: a.published !== false,
            isArchived: a.isArchived === true,
          }
        : EMPTY,
    );
    setError(null);
  }, [formKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const { id, ...payload } = form;
      const url = isNew ? "/api/admin/actualites" : `/api/admin/actualites/${id}`;
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

          <Field
            label="Étiquette"
            value={form.category}
            onChange={(v) => update("category", v)}
            placeholder="En ce moment"
            help="Petit texte rouge au-dessus du titre, pour une actualité sans date."
          />
          <Field
            label="Source"
            value={form.source}
            onChange={(v) => update("source", v)}
            placeholder="Métiers d'Art Genève"
            help="Affichée « par … » sous le titre."
          />

          <Field
            label="Sous-titre"
            value={form.subtitle}
            onChange={(v) => update("subtitle", v)}
            placeholder="Métiers du bois — Charpentier·ère"
            help="Petite ligne sous le titre, facultative."
            fullWidth
          />

          <Field
            label="Date de l'événement"
            value={form.eventDate}
            onChange={(v) => update("eventDate", v)}
            type="date"
            help="Affichée « 14 octobre » ; un événement passé disparaît de la page."
          />
          <Field
            label="Date de fin"
            value={form.eventEndDate}
            onChange={(v) => update("eventEndDate", v)}
            type="date"
            help="Pour plusieurs jours : « du 19 au 21 mars 2027 »."
          />
          <Field
            label="Horaire"
            value={form.timeLabel}
            onChange={(v) => update("timeLabel", v)}
            placeholder="19h-20h30"
            help="Texte libre, affiché à côté de la date."
          />

          <Field
            label="Lien"
            value={form.linkUrl}
            onChange={(v) => update("linkUrl", v)}
            placeholder="https://…"
            help="https://…, mailto:adresse ou une page du site (/jema)."
          />
          <Field
            label="Libellé du lien"
            value={form.linkLabel}
            onChange={(v) => update("linkLabel", v)}
            placeholder="Plus d'info"
            help="Vide : « Plus d'info », ou « Contact » pour une adresse e-mail."
          />

          {/* Upload image */}
          <div className="col-span-2">
            <span className="text-xs font-medium text-mag-gray mb-1 block">Image</span>
            <div className="flex items-start gap-4">
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu d'une URL libre (Blob ou saisie) : next/image exigerait chaque domaine dans remotePatterns
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
                  <button type="button" onClick={() => update("imageUrl", "")} className="text-xs text-mag-gray hover:text-red-700 transition-colors">
                    Retirer l&apos;image
                  </button>
                )}
                <span className="text-[11px] text-mag-gray/80">Format 4:3 conseillé, 5 Mo au plus.</span>
              </div>
            </div>
          </div>

          <TextareaField label="Texte de la carte" value={form.excerpt} onChange={(v) => update("excerpt", v)} rows={4} fullWidth />

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.published} onChange={(e) => update("published", e.target.checked)} className="h-4 w-4 accent-mag-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mag-red" />
            <span className="text-sm text-mag-dark">Publiée</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isArchived} onChange={(e) => update("isArchived", e.target.checked)} className="h-4 w-4 accent-mag-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mag-red" />
            <span className="text-sm text-mag-dark">Archivée <span className="text-xs text-mag-gray">(retirée du site, gardée ici)</span></span>
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-3">
          {!isNew && (
            <button onClick={handleDelete} disabled={saving} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50">
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

function Field({ label, value, onChange, type = "text", placeholder, help, fullWidth }: {
  label: string; value: string | null; onChange: (v: string) => void; type?: string; placeholder?: string; help?: string; fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? "col-span-2" : ""}>
      <span className="text-xs font-medium text-mag-gray mb-1 block">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
      />
      {help && <span className="mt-1 block text-[11px] text-mag-gray/80">{help}</span>}
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
        className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
      />
    </label>
  );
}
