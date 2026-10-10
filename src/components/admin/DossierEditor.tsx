"use client";

// Dossier d'onboarding d'un·e artisan·e (LOT A1) : formulaire d'éligibilité
// dans l'ordre du papier, enregistré automatiquement (1,5 s après la
// dernière frappe et à la perte de focus), actions de statut, pièces
// justificatives privées et journal de suivi.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DEACTIVATION_REASONS,
  DOSSIER_SECTIONS,
  DOSSIER_STATUSES,
  type DossierStatus,
  type FieldSpec,
} from "@/lib/dossier-fields";
import { availableActions, composePublicName, todayZurich, type DossierAction } from "@/lib/dossier-rules";
import { DossierDocuments, type DocumentRow } from "./DossierDocuments";
import { DossierJournal, type JournalRow } from "./DossierJournal";
import { ADMIN_INPUT_CLASS as inputClass } from "./AdminTable";
import { formatDay as day } from "@/lib/dates";

type Dossier = Record<string, unknown> & {
  id: string;
  status: DossierStatus;
  artisanId: string | null;
  integratedAt: string | null;
  deactivatedAt: string | null;
  deactivationReason: string | null;
  extra: Record<string, string | number | boolean | null> | null;
  socialLinks: Record<string, string> | null;
  createdAt: string;
  createdBy: string | null;
};

type Detail = {
  dossier: Dossier;
  artisan: { id: string; name: string; slug: string; published: boolean | null; address: string | null } | null;
  documents: DocumentRow[];
  journal: JournalRow[];
};

type Category = { id: string; name: string };

const AUTOSAVE_MS = 1500;

const linksToText = (links: Record<string, string> | null | undefined) =>
  links ? Object.entries(links).map(([k, v]) => `${k}: ${v}`).join("\n") : "";

// Seules les lignes complètes (« réseau: https://… ») partent au serveur : une
// URL en cours de frappe reste locale au lieu de déclencher une erreur 400.
const textToLinks = (text: string): Record<string, string> | null => {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = /^\s*([^:]+?)\s*:\s*(https?:\/\/\S+)\s*$/i.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return Object.keys(out).length ? out : null;
};

const fmtTime = (d: Date) => d.toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });

export function DossierEditor({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [linksText, setLinksText] = useState("");
  const [saveState, setSaveState] = useState<{ status: "idle" | "pending" | "saving" | "saved" | "error"; at?: Date; message?: string }>({ status: "idle" });
  const [actionPanel, setActionPanel] = useState<DossierAction | null>(null);
  const [actionForm, setActionForm] = useState({ motif: "", occurredAt: todayZurich(), text: "" });
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modifications en attente d'envoi (clé → valeur), hors du rendu pour
  // que le minuteur et le flush au blur voient toujours la dernière version.
  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const load = useCallback(async () => {
    const json = async (url: string) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
      return r.json();
    };
    try {
      const [d, cats, coms] = await Promise.all([
        json(`/api/admin/dossiers/${id}`) as Promise<Detail>,
        json("/api/admin/categories") as Promise<Category[]>,
        (json("/api/admin/communes") as Promise<{ name: string }[]>).catch(() => [] as { name: string }[]),
      ]);
      setDetail(d);
      setForm(d.dossier);
      setLinksText(linksToText(d.dossier.socialLinks));
      setCategories(cats.map((c) => ({ id: c.id, name: c.name })));
      setCommunes(coms.map((c) => c.name));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /** Envoie les modifications en attente (une requête à la fois). `keepalive` : depuis beforeunload. */
  const flush = useCallback(async (opts: { keepalive?: boolean } = {}) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inFlight.current) await inFlight.current;
    const patch = pending.current;
    if (!Object.keys(patch).length) return;
    pending.current = {};
    setSaveState({ status: "saving" });
    inFlight.current = (async () => {
      try {
        const res = await fetch(`/api/admin/dossiers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
          keepalive: opts.keepalive ?? false,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        // Valeurs normalisées par le serveur (commune officielle, trim…) sans
        // écraser ce qui a été retapé entre-temps.
        setForm((f) => {
          const next = { ...f };
          for (const k of Object.keys(patch)) if (!(k in pending.current)) next[k] = (data as Record<string, unknown>)[k];
          return next;
        });
        setSaveState({ status: "saved", at: new Date() });
      } catch (e) {
        // Les valeurs non enregistrées restent à renvoyer.
        pending.current = { ...patch, ...pending.current };
        setSaveState({ status: "error", message: e instanceof Error ? e.message : "Enregistrement impossible" });
      } finally {
        inFlight.current = null;
      }
    })();
    await inFlight.current;
  }, [id]);

  const update = useCallback(
    (key: string, value: unknown) => {
      setForm((f) => ({ ...f, [key]: value }));
      pending.current[key] = value;
      setSaveState({ status: "pending" });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
    },
    [flush],
  );

  // Perte de focus du formulaire, fermeture de l'onglet : on envoie / on prévient.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) {
        e.preventDefault();
        void flush({ keepalive: true });
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush]);

  const status = detail?.dossier.status;
  const actions = useMemo(() => (status ? availableActions(status) : []), [status]);

  const runAction = async (action: DossierAction) => {
    if (!detail) return;
    if (action !== "deactivate" && actionPanel !== action) {
      // Confirmation simple pour les actions sans motif.
      const msg =
        action === "eligible"
          ? "Déclarer éligible : la fiche publique (non publiée) sera créée à partir de ce dossier. Continuer ?"
          : detail.dossier.status === "desactive"
            ? "Réactiver : la fiche publique sera republiée. Continuer ?"
            : "Activer : la fiche publique sera publiée et la date d'intégration posée. Continuer ?";
      if (!confirm(msg)) return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      await flush();
      const res = await fetch(`/api/admin/dossiers/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(action === "deactivate" ? actionForm : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setActionPanel(null);
      setActionForm({ motif: "", occurredAt: todayZurich(), text: "" });
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!detail || detail.dossier.artisanId) return;
    if (!confirm("Supprimer ce dossier (sans fiche liée) ? Cette action est irréversible.")) return;
    const res = await fetch(`/api/admin/dossiers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Suppression impossible");
      return;
    }
    router.push("/admin/onboarding");
  };

  if (loadError) return <p className="text-mag-red">Impossible de charger le dossier ({loadError}).</p>;
  if (!detail || !status) return <p className="text-mag-gray">Chargement…</p>;

  const statusInfo = DOSSIER_STATUSES.find((s) => s.value === status)!;
  const title = composePublicName(form as { firstName?: string | null; lastName?: string | null; workshopName?: string | null }) || detail.artisan?.name || "Nouveau dossier";
  const extra = (form.extra as Record<string, string | number | boolean | null> | null) ?? null;

  return (
    <div
      className="max-w-5xl"
      // Enregistre quand le focus quitte le formulaire (pas à chaque passage de champ en champ).
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) void flush();
      }}
    >
      <div className="mb-2 text-sm">
        <Link href="/admin/onboarding" className="text-mag-gray hover:text-mag-red">
          ← Onboarding
        </Link>
      </div>

      {/* En-tête : nom, statut, enregistrement, actions */}
      <div className="mb-6 rounded-xl border border-mag-cream bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-mag-dark font-serif">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-mag-gray">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              {detail.dossier.integratedAt && <span>Intégré·e le {day(detail.dossier.integratedAt)}</span>}
              {status === "desactive" && (
                <span>
                  Désactivé·e le {day(detail.dossier.deactivatedAt)}
                  {detail.dossier.deactivationReason && ` — ${DEACTIVATION_REASONS.find((r) => r.value === detail.dossier.deactivationReason)?.label ?? detail.dossier.deactivationReason}`}
                </span>
              )}
              <span>Créé le {day(detail.dossier.createdAt)}{detail.dossier.createdBy ? ` par ${detail.dossier.createdBy}` : ""}</span>
            </div>
          </div>
          <SaveIndicator state={saveState} onRetry={() => void flush()} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {actions.map((a) => (
            <button
              key={a.action}
              type="button"
              disabled={actionBusy}
              onClick={() => (a.action === "deactivate" ? setActionPanel(actionPanel === "deactivate" ? null : "deactivate") : runAction(a.action))}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer ${
                a.action === "deactivate"
                  ? "border border-mag-cream text-mag-dark hover:border-red-700 hover:text-red-700"
                  : "bg-mag-red text-white hover:bg-mag-red-dark"
              }`}
            >
              <i className={a.action === "deactivate" ? "fas fa-ban" : a.action === "eligible" ? "fas fa-check" : "fas fa-eye"} aria-hidden />
              {a.label}
            </button>
          ))}
          {detail.artisan && (
            <span className="ml-auto text-sm text-mag-gray">
              Fiche publique : <strong className="text-mag-dark">{detail.artisan.name}</strong>{" "}
              {detail.artisan.published ? (
                <a href={`/artisans/${detail.artisan.slug}`} target="_blank" rel="noreferrer" className="text-mag-red hover:underline">
                  publiée ↗
                </a>
              ) : (
                "(non publiée)"
              )}{" "}
              · <Link href="/admin/artisans" className="text-mag-red hover:underline">modifier dans Artisans</Link>
            </span>
          )}
        </div>

        {actionPanel === "deactivate" && (
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-red-200 bg-red-50/50 p-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mag-gray">Motif *</span>
              <select
                value={actionForm.motif}
                onChange={(e) => setActionForm((f) => ({ ...f, motif: e.target.value }))}
                className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none"
              >
                <option value="">— Choisir —</option>
                {DEACTIVATION_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-mag-gray">Date</span>
              <input
                type="date"
                value={actionForm.occurredAt}
                onChange={(e) => setActionForm((f) => ({ ...f, occurredAt: e.target.value }))}
                className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none"
              />
            </label>
            <label className="block sm:col-span-3">
              <span className="mb-1 block text-xs font-medium text-mag-gray">Note (journal)</span>
              <input
                type="text"
                value={actionForm.text}
                onChange={(e) => setActionForm((f) => ({ ...f, text: e.target.value }))}
                placeholder="Ex. faillite prononcée le 28.02.2023"
                className="w-full rounded-lg border border-mag-field bg-white px-3 py-2 text-sm focus:border-mag-red focus:outline-none"
              />
            </label>
            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                type="button"
                disabled={actionBusy || !actionForm.motif}
                onClick={() => runAction("deactivate")}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 cursor-pointer"
              >
                Confirmer la désactivation{detail.artisan ? " (la fiche sera dépubliée)" : ""}
              </button>
              <button type="button" onClick={() => setActionPanel(null)} className="text-sm text-mag-gray hover:text-mag-dark">
                Annuler
              </button>
            </div>
          </div>
        )}
        {actionError && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}
      </div>

      {/* Formulaire */}
      {DOSSIER_SECTIONS.map((section) => (
        <section key={section.id} className="mb-6 rounded-xl border border-mag-cream bg-white p-5">
          <h2 className="text-base font-bold text-mag-dark font-serif">{section.title}</h2>
          {section.description && <p className="mt-1 mb-3 text-sm text-mag-gray">{section.description}</p>}
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields.map((f) => {
              if (f.showIf && form[f.showIf] !== true) return null;
              return (
                <FieldInput
                  key={f.key}
                  spec={f}
                  value={f.kind === "links" ? linksText : form[f.key]}
                  categories={categories}
                  communes={communes}
                  onChange={(v) => {
                    if (f.kind === "links") {
                      setLinksText(v as string);
                      update(f.key, textToLinks(v as string));
                    } else update(f.key, v);
                  }}
                />
              );
            })}
          </div>
        </section>
      ))}

      {/* Questions complémentaires (jsonb extra) */}
      <section className="mb-6 rounded-xl border border-mag-cream bg-white p-5">
        <h2 className="text-base font-bold text-mag-dark font-serif">Questions complémentaires</h2>
        <p className="mt-1 mb-3 text-sm text-mag-gray">
          Pour les questions ajoutées au formulaire après coup, sans attendre une mise à jour du site.
        </p>
        <ExtraEditor value={extra} onChange={(v) => update("extra", v)} />
      </section>

      <DossierDocuments dossierId={id} documents={detail.documents} onChanged={load} />
      <DossierJournal dossierId={id} journal={detail.journal} onChanged={load} />

      {!detail.dossier.artisanId && (
        <div className="mb-10 text-right">
          <button type="button" onClick={handleDelete} className="text-sm text-mag-gray hover:text-red-700 cursor-pointer">
            <i className="fas fa-trash mr-1" aria-hidden /> Supprimer ce dossier
          </button>
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state, onRetry }: { state: { status: string; at?: Date; message?: string }; onRetry: () => void }) {
  if (state.status === "idle") return null;
  if (state.status === "error") {
    return (
      <span className="text-sm text-red-700">
        <i className="fas fa-triangle-exclamation mr-1" aria-hidden />
        {state.message}{" "}
        <button type="button" onClick={onRetry} className="underline cursor-pointer">réessayer</button>
      </span>
    );
  }
  return (
    <span className="text-sm text-mag-gray">
      {state.status === "pending" && "Modifications en attente…"}
      {state.status === "saving" && "Enregistrement…"}
      {state.status === "saved" && state.at && (
        <>
          <i className="fas fa-check mr-1 text-green-700" aria-hidden />
          Enregistré à {fmtTime(state.at)}
        </>
      )}
    </span>
  );
}

function FieldInput({
  spec,
  value,
  categories,
  communes,
  onChange,
}: {
  spec: FieldSpec;
  value: unknown;
  categories: Category[];
  communes: string[];
  onChange: (v: unknown) => void;
}) {
  const span = spec.half ? "" : "sm:col-span-2";
  const label = (
    <span className="mb-1 block text-xs font-medium text-mag-gray">
      {spec.label}
      {spec.help && <span className="ml-1 font-normal text-mag-gray/80">— {spec.help}</span>}
    </span>
  );
  const str = typeof value === "string" ? value : value == null ? "" : String(value);

  switch (spec.kind) {
    case "bool": {
      const v = value === true ? "oui" : value === false ? "non" : "";
      return (
        <div className={span}>
          {label}
          <div className="inline-flex overflow-hidden rounded-lg border border-mag-field text-sm" role="radiogroup" aria-label={spec.label}>
            {[{ v: "oui", l: "Oui" }, { v: "non", l: "Non" }, { v: "", l: "—" }].map((o) => (
              <button
                key={o.v}
                type="button"
                role="radio"
                aria-checked={v === o.v}
                onClick={() => onChange(o.v === "oui" ? true : o.v === "non" ? false : null)}
                className={`px-4 py-1.5 transition-colors cursor-pointer ${v === o.v ? "bg-mag-red text-white" : "bg-white text-mag-dark hover:bg-mag-cream/40"}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      );
    }
    case "textarea":
    case "links":
      return (
        <label className={`block ${span}`}>
          {label}
          <textarea value={str} onChange={(e) => onChange(e.target.value)} rows={spec.kind === "links" ? 3 : 4} className={inputClass} />
        </label>
      );
    case "int":
      return (
        <label className={`block ${span}`}>
          {label}
          <input type="number" min={0} step={1} value={str} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} className={inputClass} />
        </label>
      );
    case "date":
      return (
        <label className={`block ${span}`}>
          {label}
          <input type="date" value={str} onChange={(e) => onChange(e.target.value || null)} className={inputClass} />
        </label>
      );
    case "select":
      return (
        <label className={`block ${span}`}>
          {label}
          <select value={str} onChange={(e) => onChange(e.target.value || null)} className={inputClass}>
            <option value="">— Aucun —</option>
            {spec.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      );
    case "category":
      return (
        <label className={`block ${span}`}>
          {label}
          <select value={str} onChange={(e) => onChange(e.target.value || null)} className={inputClass}>
            <option value="">— Aucun —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      );
    case "commune":
      if (communes.length === 0) {
        return (
          <label className={`block ${span}`}>
            {label}
            <input type="text" value={str} onChange={(e) => onChange(e.target.value || null)} placeholder="Nom officiel, ex. Carouge" className={inputClass} />
          </label>
        );
      }
      return (
        <label className={`block ${span}`}>
          {label}
          <select value={str} onChange={(e) => onChange(e.target.value || null)} className={inputClass}>
            <option value="">— Aucune —</option>
            {str && !communes.includes(str) && <option value={str}>{str} (hors liste)</option>}
            {communes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      );
    default:
      return (
        <label className={`block ${span}`}>
          {label}
          <input type="text" value={str} onChange={(e) => onChange(e.target.value)} className={inputClass} />
        </label>
      );
  }
}

function ExtraEditor({
  value,
  onChange,
}: {
  value: Record<string, string | number | boolean | null> | null;
  onChange: (v: Record<string, string | number | boolean | null> | null) => void;
}) {
  const entries = Object.entries(value ?? {});
  const [newKey, setNewKey] = useState("");
  const set = (k: string, v: string) => onChange({ ...(value ?? {}), [k]: v });
  const remove = (k: string) => {
    const next = { ...(value ?? {}) };
    delete next[k];
    onChange(Object.keys(next).length ? next : null);
  };
  const add = () => {
    const k = newKey.trim();
    if (!k || (value && k in value)) return;
    onChange({ ...(value ?? {}), [k]: "" });
    setNewKey("");
  };
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-64 shrink-0 truncate text-sm text-mag-dark" title={k}>{k}</span>
          <input type="text" value={v == null ? "" : String(v)} onChange={(e) => set(k, e.target.value)} className={inputClass} />
          <button type="button" onClick={() => remove(k)} className="text-mag-gray hover:text-red-700 cursor-pointer" aria-label={`Retirer ${k}`}>
            <i className="fas fa-times" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Nouvelle question"
          className={`${inputClass} w-64`}
        />
        <button type="button" onClick={add} disabled={!newKey.trim()} className="rounded-lg border border-mag-cream px-3 py-2 text-sm text-mag-dark hover:border-mag-red hover:text-mag-red disabled:opacity-50 cursor-pointer">
          <i className="fas fa-plus mr-1" aria-hidden /> Ajouter
        </button>
      </div>
    </div>
  );
}
