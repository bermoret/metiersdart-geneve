"use client";

import { useState, useRef } from "react";
import { PG_INT_MAX, parseCount } from "@/lib/utils";

/** Chiffres de « MAG en chiffres » (accueil) saisis à la main par MAG. */
type Figures = { craftsCount: number; eventsCount: number };
/** Saisie brute de chaque champ : convertie seulement à l'enregistrement. */
type Drafts = Record<keyof Figures, string>;

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

const SAVE_ERROR = "Erreur lors de la sauvegarde";

/** Valeurs de la base → champs (vide si NULL). */
function toDrafts(data: Partial<Record<keyof Figures, number | null>> | null): Drafts {
  return {
    craftsCount: data?.craftsCount == null ? "" : String(data.craftsCount),
    eventsCount: data?.eventsCount == null ? "" : String(data.eventsCount),
  };
}

/** Valeurs lues côté serveur par le tableau de bord (ligne absente → défauts). */
type Props = { initialCraftsCount: number | null; initialEventsCount: number | null };

export function KeyFiguresEditor({ initialCraftsCount, initialEventsCount }: Props) {
  // Valeurs en base (lues par la page, puis rafraîchies par chaque enregistrement) :
  // référence pour n'envoyer que les champs modifiés.
  const [stored, setStored] = useState<Drafts>(() =>
    toDrafts({ craftsCount: initialCraftsCount, eventsCount: initialEventsCount }),
  );
  const [drafts, setDrafts] = useState<Drafts>(stored);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function showNotice(text: string) {
    clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = setTimeout(() => setNotice(null), 2500);
  }

  async function handleSave() {
    setError(null);
    setNotice(null);

    // Seuls les champs modifiés depuis la lecture partent : l'autre chiffre,
    // peut-être changé entre-temps dans un autre onglet, n'est pas réécrit.
    const changes: Partial<Figures> = {};
    for (const f of FIELDS) {
      if (drafts[f.key] === stored[f.key]) continue;
      const raw = drafts[f.key].trim();
      const value = raw === "" ? null : parseCount(Number(raw));
      if (value == null) {
        setError(`${f.label} : nombre entier entre 0 et ${PG_INT_MAX.toLocaleString("fr-CH")} attendu`);
        return;
      }
      changes[f.key] = value;
    }
    if (Object.keys(changes).length === 0) {
      showNotice("Aucune modification");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : SAVE_ERROR);
        return;
      }
      const values = toDrafts(data);
      setStored(values);
      setDrafts(values);
      showNotice("Enregistré");
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
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
        les communes sont calculés automatiquement). Vide ou à 0, le chiffre n&apos;est pas affiché.
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
              max={PG_INT_MAX}
              step={1}
              disabled={saving}
              value={drafts[f.key]}
              aria-describedby={`figure-${f.key}-help`}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="w-24 rounded-lg border border-mag-field px-3 py-2 text-lg font-bold text-mag-dark focus:border-mag-red focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-mag-red px-5 py-2 text-sm font-semibold text-white hover:bg-mag-red/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Sauvegarde…" : "Enregistrer"}
        </button>
        {/* Région live toujours présente : seul son texte change, pour être annoncée. */}
        <span role="status" className="text-sm text-green-700 font-medium flex items-center gap-1">
          {notice && (
            <>
              <i className="fas fa-check" aria-hidden /> {notice}
            </>
          )}
        </span>
        {error && (
          <span role="alert" className="text-sm text-red-700">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
