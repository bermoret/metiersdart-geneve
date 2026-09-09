"use client";

import { useState, useRef } from "react";

type JemaData = {
  id?: string;
  year: string;
  title: string;
  startDate: string;
  endDate: string;
  isUpcoming: boolean;
  isPast: boolean;
  description: string;
  programUrl: string;
};

type Props = {
  open: boolean;
  edition: Record<string, unknown> | null;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY: JemaData = {
  year: "",
  title: "",
  startDate: "",
  endDate: "",
  isUpcoming: false,
  isPast: false,
  description: "",
  programUrl: "",
};

export function JemaModal({ open, edition, isNew, onClose, onSaved }: Props) {
  const [form, setForm] = useState<JemaData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formKey = (edition?.id as string) ?? "new";
  const [lastFormKey, setLastFormKey] = useState("");

  if (open && formKey !== lastFormKey) {
    setLastFormKey(formKey);
    const e = edition as Record<string, unknown> | null;
    setForm(
      e
        ? {
            ...EMPTY,
            ...e,
            year: e.year ? String(e.year) : "",
            startDate: e.startDate ? new Date(e.startDate as string).toISOString().slice(0, 10) : "",
            endDate: e.endDate ? new Date(e.endDate as string).toISOString().slice(0, 10) : "",
          } as JemaData
        : EMPTY,
    );
    setError(null);
  }

  if (!open) return null;

  const update = (key: keyof JemaData, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        year: Number(form.year),
        title: form.title || `JEMA ${form.year}`,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        isUpcoming: form.isUpcoming,
        isPast: form.isPast,
        description: form.description || undefined,
        programUrl: form.programUrl || undefined,
      };
      const url = isNew ? "/api/admin/jema" : `/api/admin/jema/${form.id}`;
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
    if (!confirm(`Supprimer l'édition ${form.year} ? Cette action est irréversible.`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jema/${form.id}`, { method: "DELETE" });
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
            {isNew ? "Nouvelle édition" : `Modifier — JEMA ${form.year}`}
          </h2>
          <button onClick={onClose} className="text-mag-gray hover:text-mag-dark transition-colors" aria-label="Fermer">
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Année *" value={form.year} onChange={(v) => update("year", v)} type="number" />
          <Field label="Titre" value={form.title} onChange={(v) => update("title", v)} placeholder={`JEMA ${form.year}`} />

          <Field label="Date de début" value={form.startDate} onChange={(v) => update("startDate", v)} type="date" />
          <Field label="Date de fin" value={form.endDate} onChange={(v) => update("endDate", v)} type="date" />

          <Field label="URL du programme" value={form.programUrl} onChange={(v) => update("programUrl", v)} fullWidth placeholder="https://…" />

          <TextareaField label="Description" value={form.description} onChange={(v) => update("description", v)} rows={4} fullWidth />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isUpcoming}
              onChange={(e) => update("isUpcoming", e.target.checked)}
              className="rounded border-mag-cream text-mag-red focus:ring-mag-red/20"
            />
            <span className="text-sm text-mag-dark">À venir</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPast}
              onChange={(e) => update("isPast", e.target.checked)}
              className="rounded border-mag-cream text-mag-red focus:ring-mag-red/20"
            />
            <span className="text-sm text-mag-dark">Passée</span>
          </label>
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
              disabled={saving || !form.year}
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
