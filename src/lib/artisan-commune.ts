// Commune d'une fiche artisan saisie dans l'admin : choisie dans la table
// communes (45 communes genevoises) — le champ libre avait produit « Perly »
// au lieu de « Perly-Certoux ». Serveur seulement (lit la base).

import { db } from "@/db";
import { communes } from "@/db/schema";
import { findCommuneName } from "./commune-match";

export const UNKNOWN_COMMUNE_ERROR =
  "Commune inconnue : choisissez-la dans la liste des communes genevoises.";

/**
 * Valeur envoyée → valeur à enregistrer : absente → undefined (inchangée),
 * vide ou null → null, nom de la table (graphie tolérée via communeKey) → nom
 * de la table ; autre chose → erreur (400).
 */
export async function resolveArtisanCommune(
  raw: unknown,
): Promise<{ commune: string | null | undefined } | { error: string }> {
  if (raw === undefined) return { commune: undefined };
  if (raw === null || (typeof raw === "string" && !raw.trim())) return { commune: null };
  if (typeof raw !== "string") return { error: UNKNOWN_COMMUNE_ERROR };

  const names = (await db.select({ name: communes.name }).from(communes)).map((c) => c.name);
  const name = findCommuneName(raw, names);
  return name ? { commune: name } : { error: UNKNOWN_COMMUNE_ERROR };
}
