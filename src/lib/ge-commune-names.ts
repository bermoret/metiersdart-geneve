// Noms officiels des 45 communes genevoises, tels que les porte le tracé de la
// carte (ge-communes.json, swisstopo). Une commune dont le nom ne correspond à
// aucun tracé retombe en simple point sur la carte : l'admin s'y limite.
// Serveur seulement de préférence (le JSON pèse ~85 Ko).

import geCommunes from "./ge-communes.json";
import { findCommuneName } from "./commune-match";

export const OFFICIAL_COMMUNE_ERROR =
  "Nom de commune inconnu : utilisez le nom officiel d'une des 45 communes genevoises.";

export const GE_COMMUNE_NAMES: readonly string[] = geCommunes.features.map((f) => f.properties.name);

/** Nom officiel correspondant à `input` (via communeKey), ou undefined s'il n'a pas de tracé. */
export function officialCommuneName(input: string): string | undefined {
  return findCommuneName(input, GE_COMMUNE_NAMES);
}
