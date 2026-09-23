"use client";

import { useState, useEffect } from "react";

export function CommunautePasswordEditor() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.communautePassword) setPassword(data.communautePassword);
      })
      .catch(() => {})
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
        body: JSON.stringify({ communautePassword: password }),
      });
      if (!res.ok) throw new Error("Échec");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="rounded-xl border border-mag-cream bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <i className="fas fa-key text-xl text-mag-red" aria-hidden />
        <h2 className="text-lg font-bold text-mag-dark font-serif">
          Mot de passe Espace Communauté
        </h2>
      </div>
      <p className="text-sm text-mag-gray mb-4">
        Mot de passe commun pour accéder à l&apos;espace Communauté.
        Destiné à être renouvelé chaque année.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="ex. MAG 2026"
          className="flex-1 rounded-lg border border-mag-field px-3 py-2 text-sm font-medium text-mag-dark focus:border-mag-red focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={saving || !password.trim()}
          className="rounded-full bg-mag-red px-5 py-2 text-sm font-semibold text-white hover:bg-mag-red/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "…" : "Enregistrer"}
        </button>
        {saved && (
          <span className="text-sm text-green-700 font-medium flex items-center gap-1">
            <i className="fas fa-check" /> OK
          </span>
        )}
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>
    </div>
  );
}
