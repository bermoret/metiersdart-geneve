// Corps du PUT /api/admin/settings → modification partielle de site_settings.
// Fonction pure (sans base) pour être testée : seuls les champs envoyés
// figurent dans le patch — enregistrer le mot de passe Communauté remettait
// « projets menés » à 0 quand le PUT réécrivait tous les champs.

import { PG_INT_MAX, parseCount } from "./utils";

export type SettingsPatch = {
  eventsCount?: number;
  craftsCount?: number;
  communautePassword?: string;
};

export function parseSettingsInput(body: unknown): { patch: SettingsPatch } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Requête invalide" };
  }
  const input = body as Record<string, unknown>;

  const eventsCount = parseCount(input.eventsCount);
  const craftsCount = parseCount(input.craftsCount);
  if (eventsCount === null || craftsCount === null) {
    return {
      error: `Les chiffres doivent être des entiers entre 0 et ${PG_INT_MAX.toLocaleString("fr-CH")}`,
    };
  }

  const communautePassword =
    typeof input.communautePassword === "string" && input.communautePassword.trim()
      ? input.communautePassword.trim().slice(0, 255)
      : undefined;

  const patch: SettingsPatch = {};
  if (eventsCount !== undefined) patch.eventsCount = eventsCount;
  if (craftsCount !== undefined) patch.craftsCount = craftsCount;
  if (communautePassword !== undefined) patch.communautePassword = communautePassword;
  if (Object.keys(patch).length === 0) return { error: "Aucun paramètre à modifier" };

  return { patch };
}
