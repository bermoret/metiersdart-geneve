"use client";

import { useState, useEffect } from "react";

type CategoryData = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: string;
};

type Props = {
  open: boolean;
  category: Record<string, unknown> | null;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY: CategoryData = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  color: "",
  sortOrder: "0",
};

const ICON_OPTIONS = [
  { value: "", label: "— Aucune —" },
  { value: "fas fa-tshirt", label: "Textile (t-shirt)" },
  { value: "fas fa-stamp", label: "Cuir (tampon)" },
  { value: "fas fa-clock", label: "Horlogerie (horloge)" },
  { value: "fas fa-tree", label: "Bois (arbre)" },
  { value: "fas fa-newspaper", label: "Papier (journal)" },
  { value: "fas fa-guitar", label: "Facture (guitare)" },
  { value: "fas fa-hands", label: "Terre (mains)" },
  { value: "fas fa-paint-brush", label: "Arts appliqués (pinceau)" },
  { value: "fas fa-wine-glass", label: "Verre (verre)" },
  { value: "fas fa-gavel", label: "Pierre (maillet)" },
  { value: "fas fa-link", label: "Métal (maillon)" },
  { value: "fas fa-book", label: "Conservation (livre)" },
  { value: "fas fa-university", label: "Institutions (université)" },
  { value: "fas fa-school", label: "Écoles (école)" },
  { value: "fas fa-people-arrows", label: "Associations (personnes)" },
  { value: "fas fa-handshake", label: "Partenaires (poignée de main)" },
];

export function CategoryModal({ open, category, isNew, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CategoryData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens / data changes
  const formKey = (category?.id as string) ?? "new";
  useEffect(() => {
    if (!open) return;
    const c = category as Record<string, unknown> | null;
    setForm(
      c
        ? {
            ...EMPTY,
            ...c,
            sortOrder: c.sortOrder ? String(c.sortOrder) : "0",
          } as CategoryData
        : EMPTY,
    );
    setError(null);
  }, [formKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const update = (key: keyof CategoryData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        icon: form.icon || undefined,
        color: form.color || undefined,
        sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
      };
      const url = isNew ? "/api/admin/categories" : `/api/admin/categories/${form.id}`;
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
    if (!confirm(`Supprimer "${form.name}" ?`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${form.id}`, { method: "DELETE" });
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
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-mag-dark font-serif">
            {isNew ? "Nouvelle catégorie" : `Modifier — ${form.name}`}
          </h2>
          <button onClick={onClose} className="text-mag-gray hover:text-mag-dark transition-colors" aria-label="Fermer">
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom *" value={form.name} onChange={(v) => update("name", v)} />
          <Field label="Slug" value={form.slug} onChange={(v) => update("slug", v)} placeholder="auto-généré" />

          <SelectField
            label="Icône"
            value={form.icon}
            onChange={(v) => update("icon", v)}
            options={ICON_OPTIONS}
          />
          <Field label="Couleur" value={form.color} onChange={(v) => update("color", v)} placeholder="#b42c36" />

          <Field label="Ordre de tri" value={form.sortOrder} onChange={(v) => update("sortOrder", v)} type="number" />
          <div className="col-span-2 flex items-center gap-3">
            {form.icon && (
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-sm shrink-0" style={{ backgroundColor: form.color || "#999" }}>
                <i className={form.icon} />
              </span>
            )}
            {form.color && (
              <span className="inline-block w-6 h-6 rounded-full border border-mag-cream" style={{ backgroundColor: form.color }} />
            )}
          </div>

          <TextareaField label="Description" value={form.description} onChange={(v) => update("description", v)} rows={3} fullWidth />
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

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
