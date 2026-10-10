"use client";

// Journal de suivi d'un dossier (ajout seul) : remarques datées, changements
// d'adresse, fermetures saisis à la main ; activation, désactivation et
// éligibilité écrits par les actions.

import { useState } from "react";
import { DEACTIVATION_REASONS, JOURNAL_TYPES, MANUAL_JOURNAL_TYPES, type JournalType } from "@/lib/dossier-fields";
import { todayZurich } from "@/lib/dossier-rules";
import { formatDay as day } from "@/lib/dates";

export type JournalRow = {
  id: string;
  type: JournalType;
  occurredAt: string;
  text: string | null;
  motif: string | null;
  author: string | null;
  createdAt: string;
};

const ICONS: Record<JournalType, string> = {
  remarque: "fas fa-comment",
  changement_adresse: "fas fa-map-marker-alt",
  fermeture: "fas fa-door-closed",
  activation: "fas fa-eye",
  desactivation: "fas fa-ban",
  eligibilite: "fas fa-check",
};

export function DossierJournal({ dossierId, journal, onChanged }: { dossierId: string; journal: JournalRow[]; onChanged: () => Promise<void> | void }) {
  const [type, setType] = useState<JournalType>("remarque");
  const [occurredAt, setOccurredAt] = useState(todayZurich());
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dossiers/${dossierId}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, occurredAt, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Ajout impossible");
      setText("");
      setOccurredAt(todayZurich());
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ajout impossible");
    } finally {
      setBusy(false);
    }
  };

  const typeLabel = (t: JournalType) => JOURNAL_TYPES.find((j) => j.value === t)?.label ?? t;
  const motifLabel = (m: string | null) => (m ? DEACTIVATION_REASONS.find((r) => r.value === m)?.label ?? m : null);

  return (
    <section className="mb-6 rounded-xl border border-mag-cream bg-white p-5">
      <h2 className="text-base font-bold text-mag-dark font-serif">Journal de suivi</h2>
      <p className="mt-1 mb-3 text-sm text-mag-gray">Remarques datées, changements d’adresse, fermetures. Les entrées ne se modifient pas.</p>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-mag-cream bg-mag-sand/20 p-4 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-mag-gray">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as JournalType)} className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none">
            {MANUAL_JOURNAL_TYPES.map((t) => (
              <option key={t} value={t}>{typeLabel(t)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-mag-gray">Date</span>
          <input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-mag-gray">Texte</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder="Ex. appel avec Elsa, changement de propriétaire…"
              className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none"
            />
            <button type="button" onClick={submit} disabled={busy || !text.trim()} className="shrink-0 rounded-lg bg-mag-red px-4 py-2 text-sm font-semibold text-white hover:bg-mag-red-dark disabled:opacity-50 cursor-pointer">
              Ajouter
            </button>
          </div>
        </label>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {journal.length === 0 ? (
        <p className="text-sm text-mag-gray">Aucune entrée.</p>
      ) : (
        <ol className="space-y-2">
          {journal.map((j) => (
            <li key={j.id} className="flex gap-3 text-sm">
              <span className="w-24 shrink-0 text-mag-gray whitespace-nowrap">{day(j.occurredAt)}</span>
              <i className={`${ICONS[j.type]} mt-1 w-4 text-center text-mag-red`} aria-hidden />
              <span className="text-mag-dark">
                <span className="font-medium">{typeLabel(j.type)}</span>
                {motifLabel(j.motif) && <span className="text-mag-gray"> · {motifLabel(j.motif)}</span>}
                {j.text && <span> — {j.text}</span>}
                {j.author && <span className="text-mag-gray"> ({j.author})</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
