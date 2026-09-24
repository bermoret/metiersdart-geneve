"use client";

import { useState, useEffect } from "react";

/** Chiffres de « MAG en chiffres » (accueil) saisis à la main par MAG. */
type Figures = { craftsCount: number; eventsCount: number };

const FIELDS: { key: keyof Figures; label: string; help: string }[] = [
  {
    key: "craftsCount",
    label: "Métiers",
    help: "Nombre de métiers selon la nomenclature MAG (tableau de statistiques).",
  },
  {
    key: "eventsCount",
    label: "Projets menés",
    help: "Nombre d'événements ou projets menés par MAG.",
  },
];

export function KeyFiguresEditor() {
  const [figures, setFigures] = useState<Figures>({ craftsCount: 0, eventsCount: 0 });
  const [loading, setLoading] = useState(true);
  // Tant que les valeurs n'ont pas été lues, pas d'enregistrement possible :
  // on écraserait les vrais chiffres par des 0.
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        setFigures({
          craftsCount: data?.craftsCount ?? 0,
          eventsCount: data?.eventsCount ?? 0,
        });
        setLoaded(true);
      })
      .catch(() => setError("Impossible de charger les paramètres"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(figures),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : "Erreur lors de la sauvegarde");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-mag-cream bg-white p-6">
        <p className="text-sm text-mag-gray">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-mag-cream bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-chart-simple text-xl text-mag-red" aria-hidden />
        <h2 className="text-lg font-bold text-mag-dark font-serif">
          MAG en chiffres
        </h2>
      </div>
      <p className="text-sm text-mag-gray mb-4">
        Chiffres saisis manuellement pour la page d&apos;accueil (les artisan·e·s et
        les communes sont calculés automatiquement). À 0, le chiffre n&apos;est pas affiché.
      </p>
      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`figure-${f.key}`} className="block text-sm font-semibold text-mag-dark">
              {f.label}
            </label>
            <p id={`figure-${f.key}-help`} className="text-xs text-mag-gray mb-1">
              {f.help}
            </p>
            <input
              id={`figure-${f.key}`}
              type="number"
              min={0}
              max={2147483647}
              step={1}
              disabled={!loaded}
              value={figures[f.key]}
              aria-describedby={`figure-${f.key}-help`}
              onChange={(e) =>
                setFigures((prev) => ({ ...prev, [f.key]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))
              }
              className="w-24 rounded-lg border border-mag-field px-3 py-2 text-lg font-bold text-mag-dark focus:border-mag-red focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !loaded}
          className="rounded-full bg-mag-red px-5 py-2 text-sm font-semibold text-white hover:bg-mag-red/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Sauvegarde…" : "Enregistrer"}
        </button>
        {saved && (
          <span role="status" className="text-sm text-green-700 font-medium flex items-center gap-1">
            <i className="fas fa-check" aria-hidden /> Enregistré
          </span>
        )}
        {error && (
          <span role="alert" className="text-sm text-red-700">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
