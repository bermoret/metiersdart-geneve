"use client";

import { useState, useRef } from "react";

type Category = { id: string; name: string };

type ArtisanData = {
  id?: string;
  name: string;
  slug: string;
  type: string;
  craft: string;
  commune: string;
  categoryId: string;
  address: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  website: string;
  shortDescription: string;
  longDescription: string;
  imageUrl: string;
  published: boolean;
};

type Props = {
  open: boolean;
  artisan: Record<string, unknown> | null;
  categories: Category[];
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const ARTISAN_TYPES = [
  { value: "artisan", label: "Artisan" },
  { value: "atelier", label: "Atelier" },
  { value: "entreprise", label: "Entreprise" },
  { value: "institution_culturelle", label: "Institution culturelle" },
  { value: "ecole_formatrice", label: "École formatrice" },
  { value: "association_professionnelle", label: "Association professionnelle" },
  { value: "partenaire", label: "Partenaire" },
];

const EMPTY: ArtisanData = {
  name: "", slug: "", type: "artisan", craft: "", commune: "",
  categoryId: "", address: "", latitude: "", longitude: "",
  phone: "", email: "", website: "", shortDescription: "",
  longDescription: "", imageUrl: "", published: true,
};

export function ArtisanModal({ open, artisan, categories, isNew, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ArtisanData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  const formKey = (artisan?.id as string) ?? "new";
  const [lastFormKey, setLastFormKey] = useState("");

  if (open && formKey !== lastFormKey) {
    setLastFormKey(formKey);
    const a = artisan as Record<string, unknown> | null;
    setForm(
      a
        ? {
            ...EMPTY,
            ...a,
            latitude: a.latitude ? String(a.latitude) : "",
            longitude: a.longitude ? String(a.longitude) : "",
          } as ArtisanData
        : EMPTY,
    );
    setError(null);
  }

  if (!open) return null;

  const update = (key: keyof ArtisanData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Upload image to Vercel Blob
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

  // Géocoder l'adresse automatiquement
  const handleGeocode = async () => {
    if (!(form.address ?? "").trim()) {
      setError("Entrez d'abord une adresse");
      return;
    }
    setGeocoding(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/geocode?address=${encodeURIComponent(form.address ?? "")}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Adresse non trouvée");
      }
      const data = await res.json();
      update("latitude", String(data.lat));
      update("longitude", String(data.lon));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de géocodage");
    } finally {
      setGeocoding(false);
    }
  };

  // Auto-géocoder quand l'adresse perd le focus
  const handleAddressBlur = () => {
    if ((form.address ?? "").trim() && !form.latitude) {
      handleGeocode();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId || undefined,
        latitude: form.latitude || undefined,
        longitude: form.longitude || undefined,
      };
      const url = isNew ? "/api/admin/artisans" : `/api/admin/artisans/${form.id}`;
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
    if (!confirm(`Supprimer "${form.name}" ? Cette action est irréversible.`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/artisans/${form.id}`, { method: "DELETE" });
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-mag-dark font-serif">
            {isNew ? "Nouvel artisan" : `Modifier — ${form.name}`}
          </h2>
          <button onClick={onClose} className="text-mag-gray hover:text-mag-dark transition-colors" aria-label="Fermer">
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom *" value={form.name} onChange={(v) => update("name", v)} />
          <Field label="Slug" value={form.slug} onChange={(v) => update("slug", v)} placeholder="auto-généré" />

          <SelectField label="Type" value={form.type} onChange={(v) => update("type", v)} options={ARTISAN_TYPES} />
          <SelectField
            label="Domaine"
            value={form.categoryId}
            onChange={(v) => update("categoryId", v)}
            options={[{ value: "", label: "— Aucun —" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />

          <Field label="Métier" value={form.craft} onChange={(v) => update("craft", v)} />
          <Field label="Commune" value={form.commune} onChange={(v) => update("commune", v)} />

          {/* Adresse avec géocodage auto */}
          <div className="col-span-2">
            <label className="block">
              <span className="text-xs font-medium text-mag-gray mb-1 block">Adresse</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  onBlur={handleAddressBlur}
                  placeholder="Rue et numéro, NPA commune"
                  className="flex-1 rounded-lg border border-mag-cream bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none focus:ring-2 focus:ring-mag-red/20"
                />
                <button
                  type="button"
                  onClick={handleGeocode}
                  disabled={geocoding || !(form.address ?? "").trim()}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-mag-cream px-3 py-2 text-xs font-medium text-mag-dark hover:border-mag-red hover:text-mag-red transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {geocoding ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-mag-gray/30 border-t-mag-red rounded-full animate-spin" />
                  ) : (
                    <i className="fas fa-map-marker-alt" />
                  )}
                  Géocoder
                </button>
              </div>
            </label>
          </div>

          <Field label="Téléphone" value={form.phone} onChange={(v) => update("phone", v)} />
          <Field label="E-mail" value={form.email} onChange={(v) => update("email", v)} />

          <Field label="Site internet" value={form.website} onChange={(v) => update("website", v)} fullWidth />

          {/* Upload image */}
          <div className="col-span-2">
            <span className="text-xs font-medium text-mag-gray mb-1 block">Photo</span>
            <div className="flex items-start gap-4">
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Aperçu"
                  className="w-24 h-24 rounded-lg object-cover border border-mag-cream shrink-0"
                />
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
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
                      {form.imageUrl ? "Changer la photo" : "Importer une photo"}
                    </>
                  )}
                </button>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => update("imageUrl", "")}
                    className="text-xs text-mag-gray hover:text-red-500 transition-colors"
                  >
                    Retirer la photo
                  </button>
                )}
              </div>
            </div>
            {form.imageUrl && (
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => update("imageUrl", e.target.value)}
                className="mt-2 w-full rounded-lg border border-mag-cream bg-white px-3 py-1.5 text-xs text-mag-gray focus:border-mag-red focus:outline-none"
                placeholder="URL de l'image"
              />
            )}
          </div>

          {/* Coordonnées (read-only, calculées par géocodage) */}
          <Field label="Latitude" value={form.latitude} onChange={(v) => update("latitude", v)} type="number" />
          <Field label="Longitude" value={form.longitude} onChange={(v) => update("longitude", v)} type="number" />

          <TextareaField label="Description courte" value={form.shortDescription} onChange={(v) => update("shortDescription", v)} rows={2} fullWidth />
          <TextareaField label="Description longue" value={form.longDescription} onChange={(v) => update("longDescription", v)} rows={5} fullWidth />

          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
              className="rounded border-mag-cream text-mag-red focus:ring-mag-red/20"
            />
            <span className="text-sm text-mag-dark">Publié</span>
          </label>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <i className="fas fa-trash" /> Supprimer
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onClose} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-medium text-mag-gray hover:text-mag-dark transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !(form.name ?? "").trim()}
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

function SelectField({ label, value, onChange, options, fullWidth }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? "col-span-2" : ""}>
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
