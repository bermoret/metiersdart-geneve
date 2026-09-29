"use client";

import { useState, useRef, useEffect } from "react";
import { upload } from "@vercel/blob/client";
import { MEDIA_TYPES, type MediaType } from "@/lib/actu-medias";
import { PDF_MAX_BYTES, hasPdfMagic, pdfPathname } from "@/lib/pdf-upload";

// Formulaire d'un média de /medias : le type choisit la section de la page et
// l'adresse demandée (vidéo, article ou PDF). La plateforme vidéo est déduite
// de l'adresse par le serveur (src/lib/actu-medias-input.ts). Seule l'adresse
// du type choisi est envoyée ; les autres sont vidées.

type MediaData = {
  id?: string;
  title: string;
  type: MediaType;
  videoUrl: string;
  externalUrl: string;
  pdfUrl: string;
  date: string;
  source: string;
  sortOrder: string;
  published: boolean;
};

type Props = {
  open: boolean;
  media: Record<string, unknown> | null;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY: MediaData = {
  title: "",
  type: "video",
  videoUrl: "",
  externalUrl: "",
  pdfUrl: "",
  date: "",
  source: "",
  sortOrder: "0",
  published: true,
};

/** Adresse et sous-titre attendus selon le type. */
const HINTS: Record<MediaType, { url: "videoUrl" | "externalUrl" | "pdfUrl"; urlLabel: string; urlHelp: string; sourceLabel: string; sourcePlaceholder: string }> = {
  video: {
    url: "videoUrl",
    urlLabel: "Adresse de la vidéo *",
    urlHelp: "Lien Vimeo (https://vimeo.com/…) ou YouTube (https://www.youtube.com/watch?v=…).",
    sourceLabel: "Domaine",
    sourcePlaceholder: "Art du bois",
  },
  interview: {
    url: "videoUrl",
    urlLabel: "Adresse de la vidéo *",
    urlHelp: "Lien Vimeo ou YouTube. Affichée dans « On parle des métiers d'art ».",
    sourceLabel: "Sous-titre",
    sourcePlaceholder: "Interview CCI Geneva",
  },
  article: {
    url: "externalUrl",
    urlLabel: "Adresse de l'article *",
    urlHelp: "https://… — affiché dans « On parle des métiers d'art », à côté des vidéos.",
    sourceLabel: "Média",
    sourcePlaceholder: "Léman Bleu",
  },
  presse: {
    url: "pdfUrl",
    urlLabel: "Adresse du PDF *",
    urlHelp: "https://… — bouton « Titre (PDF) » de la revue de presse JEMA.",
    sourceLabel: "Source",
    sourcePlaceholder: "JEMA",
  },
  archive: {
    url: "externalUrl",
    urlLabel: "Adresse de l'article *",
    urlHelp: "https://… — liste « Articles archivés », classée par date.",
    sourceLabel: "Média",
    sourcePlaceholder: "24 heures / Tribune de Genève",
  },
};

/** Types dont l'adresse peut être un PDF importé (revue de presse, article archivé). */
const PDF_UPLOAD_TYPES: readonly MediaType[] = ["presse", "archive"];

const isType = (v: unknown): v is MediaType => MEDIA_TYPES.some((t) => t.value === v);
const str = (v: unknown) => (typeof v === "string" ? v : "");

export function MediaModal({ open, media, isNew, onClose, onSaved }: Props) {
  const [form, setForm] = useState<MediaData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens / data changes
  const formKey = (media?.id as string) ?? "new";
  useEffect(() => {
    if (!open) return;
    const m = media;
    setForm(
      m
        ? {
            id: str(m.id),
            title: str(m.title),
            type: isType(m.type) ? m.type : "video",
            videoUrl: str(m.videoUrl),
            externalUrl: str(m.externalUrl),
            pdfUrl: str(m.pdfUrl),
            date: m.date ? new Date(m.date as string).toISOString().slice(0, 10) : "",
            source: str(m.source),
            sortOrder: m.sortOrder != null ? String(m.sortOrder) : "0",
            published: m.published !== false,
          }
        : EMPTY,
    );
    setError(null);
  }, [formKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const update = (key: keyof MediaData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const hint = HINTS[form.type];
  const canUploadPdf = PDF_UPLOAD_TYPES.includes(form.type);

  // PDF envoyé directement du navigateur vers Blob (jeton : /api/admin/upload/pdf),
  // les revues de presse dépassant la limite de 4,5 Mo d'une fonction Vercel.
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const field = hint.url;
    setError(null);
    if (file.size > PDF_MAX_BYTES) {
      setError(`PDF trop volumineux (${PDF_MAX_BYTES / 1024 / 1024} Mo au plus).`);
      return;
    }
    if (!hasPdfMagic(new Uint8Array(await file.slice(0, 5).arrayBuffer()))) {
      setError("Ce fichier n'est pas un PDF.");
      return;
    }
    setUploading(true);
    try {
      const blob = await upload(pdfPathname(file.name), file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/pdf",
        contentType: "application/pdf",
        multipart: file.size > 5 * 1024 * 1024,
      });
      update(field, blob.url);
    } catch (err) {
      setError(err instanceof Error ? `Envoi du PDF impossible : ${err.message}` : "Envoi du PDF impossible");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Seule l'adresse du type choisi : une adresse restée d'un autre type
      // (champ masqué) ne bloque pas l'enregistrement et n'est pas conservée.
      const urlOf = (field: typeof hint.url) => (field === hint.url ? form[field] : null);
      const payload = {
        title: form.title,
        type: form.type,
        videoUrl: urlOf("videoUrl"),
        externalUrl: urlOf("externalUrl"),
        pdfUrl: urlOf("pdfUrl"),
        date: form.date,
        source: form.source,
        sortOrder: Number(form.sortOrder) || 0,
        published: form.published,
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

          <SelectField
            label="Section de la page"
            value={form.type}
            onChange={(v) => isType(v) && update("type", v)}
            options={MEDIA_TYPES}
          />
          <Field
            label={hint.sourceLabel}
            value={form.source}
            onChange={(v) => update("source", v)}
            placeholder={hint.sourcePlaceholder}
            help="Affiché sous le titre."
          />

          {/* Adresse selon le type */}
          <Field
            key={hint.url}
            label={hint.urlLabel}
            value={form[hint.url]}
            onChange={(v) => update(hint.url, v)}
            fullWidth
            placeholder="https://…"
            help={hint.urlHelp}
          />

          {canUploadPdf && (
            <div className="col-span-2 -mt-2 flex flex-wrap items-center gap-3">
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handlePdfUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
                className="inline-flex items-center gap-2 rounded-lg border border-mag-cream px-4 py-2 text-sm font-medium text-mag-dark hover:border-mag-red hover:text-mag-red transition-colors disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-mag-gray/30 border-t-mag-red rounded-full animate-spin" />
                    Envoi…
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload" />
                    {form[hint.url] ? "Remplacer par un PDF" : "Importer un PDF"}
                  </>
                )}
              </button>
              <span className="text-[11px] text-mag-gray/80">
                Remplit l&apos;adresse ci-dessus. {PDF_MAX_BYTES / 1024 / 1024} Mo au plus.
              </span>
            </div>
          )}

          {(form.type === "presse" || form.type === "archive") && (
            <Field
              label="Date"
              value={form.date}
              onChange={(v) => update("date", v)}
              type="date"
              help={form.type === "presse" ? "Classe les revues, la plus récente d'abord." : "Affichée « 14.10.2021 », la plus récente d'abord."}
            />
          )}
          {(form.type === "video" || form.type === "interview" || form.type === "article") && (
            <Field
              label="Ordre d'affichage"
              value={form.sortOrder}
              onChange={(v) => update("sortOrder", v)}
              type="number"
              help="Du plus petit au plus grand ; même ordre : le plus ancien d'abord."
            />
          )}

          <label className="flex items-center gap-2 col-span-2">
            <input type="checkbox" checked={form.published} onChange={(e) => update("published", e.target.checked)} className="h-4 w-4 accent-mag-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mag-red" />
            <span className="text-sm text-mag-dark">Publié</span>
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
              disabled={saving || uploading || !(form.title ?? "").trim()}
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

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly { value: string; label: string }[];
}) {
  return (
    <label>
      <span className="text-xs font-medium text-mag-gray mb-1 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none"
      >
        {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
      </select>
    </label>
  );
}
