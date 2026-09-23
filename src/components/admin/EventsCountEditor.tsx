"use client";

import { useState, useEffect } from "react";

export function EventsCountEditor() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.eventsCount != null) setCount(data.eventsCount);
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
        body: JSON.stringify({ eventsCount: count }),
      });
      if (!res.ok) throw new Error("Échec de la sauvegarde");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Erreur lors de la sauvegarde");
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
        <i className="fas fa-calendar-check text-xl text-mag-red" aria-hidden />
        <h2 className="text-lg font-bold text-mag-dark font-serif">
          Événements &amp; projets MAG
        </h2>
      </div>
      <p className="text-sm text-mag-gray mb-4">
        Nombre d&apos;événements ou projets menés par MAG. Cette valeur est saisie
        manuellement, elle n&apos;est pas calculée automatiquement.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-24 rounded-lg border border-mag-field px-3 py-2 text-lg font-bold text-mag-dark focus:border-mag-red focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-mag-red px-5 py-2 text-sm font-semibold text-white hover:bg-mag-red/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Sauvegarde…" : "Enregistrer"}
        </button>
        {saved && (
          <span className="text-sm text-green-700 font-medium flex items-center gap-1">
            <i className="fas fa-check" aria-hidden /> Enregistré
          </span>
        )}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  );
}
