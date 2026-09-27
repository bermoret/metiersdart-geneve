// Rapprochement d'un nom de commune saisi avec une liste de référence, sans
// dépendre de la graphie : même règle que la carte (communeKey) — article,
// « (GE) », ligature œ et accents neutralisés.

import { communeKey } from "./utils";

/** Nom de la liste qui correspond à `input` (égalité exacte d'abord, puis communeKey). */
export function findCommuneName(input: string, names: readonly string[]): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  if (names.includes(trimmed)) return trimmed;
  const key = communeKey(trimmed);
  return names.find((n) => communeKey(n) === key);
}
