// Règles métier des dossiers artisans (LOT A1) : transitions de statut,
// composition du nom public et de l'adresse, fiche publique créée au passage
// « Éligible », unicité du slug. Fichier pur, testé dans dossier-rules.test.ts.

import { slugify } from "./utils";
import type { DossierStatus, JournalType } from "./dossier-fields";

export type DossierAction = "eligible" | "activate" | "deactivate";

export const ACTION_TRANSITIONS: Readonly<
  Record<DossierAction, { from: readonly DossierStatus[]; to: DossierStatus; journal: JournalType }>
> = {
  eligible: { from: ["en_evaluation"], to: "eligible", journal: "eligibilite" },
  activate: { from: ["eligible", "desactive"], to: "actif", journal: "activation" },
  deactivate: { from: ["en_evaluation", "eligible", "actif"], to: "desactive", journal: "desactivation" },
};

export function isDossierAction(v: unknown): v is DossierAction {
  return v === "eligible" || v === "activate" || v === "deactivate";
}

/** Statut après `action`, ou null si la transition n'est pas permise. */
export function nextStatus(current: DossierStatus, action: DossierAction): DossierStatus | null {
  const t = ACTION_TRANSITIONS[action];
  return t.from.includes(current) ? t.to : null;
}

/** Libellés des boutons selon le statut courant (réactivation ≠ activation). */
export function availableActions(status: DossierStatus): { action: DossierAction; label: string }[] {
  const out: { action: DossierAction; label: string }[] = [];
  if (nextStatus(status, "eligible")) out.push({ action: "eligible", label: "Éligible : créer la fiche" });
  if (nextStatus(status, "activate")) out.push({ action: "activate", label: status === "desactive" ? "Réactiver" : "Activer : publier la fiche" });
  if (nextStatus(status, "deactivate")) out.push({ action: "deactivate", label: "Désactiver…" });
  return out;
}

type NameParts = { firstName?: string | null; lastName?: string | null; workshopName?: string | null };

/**
 * Nom public, forme des fiches existantes : « Bespoak — Jason Lugrin »,
 * « Sylvio Asseo » (sans atelier), « Rosso encadrements » (sans personne).
 */
export function composePublicName({ firstName, lastName, workshopName }: NameParts): string {
  const person = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
  const shop = workshopName?.trim() ?? "";
  if (shop && person) return `${shop} — ${person}`;
  return shop || person;
}

type AddressParts = { street?: string | null; postalCode?: string | null; city?: string | null };

/** « Rue de la Synagogue 32, 1204 Genève » ; null si rien n'est renseigné. */
export function composeAddress({ street, postalCode, city }: AddressParts): string | null {
  const locality = [postalCode?.trim(), city?.trim()].filter(Boolean).join(" ");
  const parts = [street?.trim(), locality].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export type DossierForFiche = NameParts &
  AddressParts & {
    craft?: string | null;
    categoryId?: string | null;
    commune?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    socialLinks?: Record<string, string> | null;
    poinconType?: string | null;
    contactPublicConsent?: boolean | null;
  };

export type FicheValues = {
  name: string;
  type: "artisan";
  craft: string | null;
  categoryId: string | null;
  commune: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialLinks: Record<string, string> | null;
  poinconType: string | null;
  published: false;
  jemaParticipant: false;
};

/**
 * Fiche publique pré-remplie depuis le dossier (bouton « Éligible »).
 * Téléphone et mail ne passent que si l'artisan·e a consenti à leur affichage.
 */
export function ficheFromDossier(d: DossierForFiche): FicheValues | { error: string } {
  const name = composePublicName(d);
  if (!name) return { error: "Renseignez au moins un nom ou un nom d'atelier avant de créer la fiche." };
  const consent = d.contactPublicConsent === true;
  return {
    name,
    type: "artisan",
    craft: d.craft?.trim() || null,
    categoryId: d.categoryId ?? null,
    commune: d.commune?.trim() || null,
    address: composeAddress(d),
    phone: consent ? d.phone?.trim() || null : null,
    email: consent ? d.email?.trim() || null : null,
    website: d.website?.trim() || null,
    socialLinks: d.socialLinks && Object.keys(d.socialLinks).length ? d.socialLinks : null,
    poinconType: d.poinconType ?? null,
    published: false,
    jemaParticipant: false,
  };
}

/** Slug libre : base, puis base-2, base-3… (`taken` = slugs déjà en base). */
export function uniqueSlug(name: string, taken: ReadonlySet<string>): string {
  const base = slugify(name) || "artisan";
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Texte de l'entrée de journal écrite quand l'adresse de la fiche change. */
export function addressChangeText(oldAddress: string | null, newAddress: string | null): string {
  const from = oldAddress?.trim() || "(aucune)";
  const to = newAddress?.trim() || "(aucune)";
  return `Adresse modifiée : ${from} → ${to}`;
}

/** Date du jour en Suisse, « YYYY-MM-DD » (les dates du journal sont des jours). */
export function todayZurich(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
