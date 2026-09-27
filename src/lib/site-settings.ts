// Paramètres saisis par MAG dans l'admin (table singleton site_settings),
// lus côté public. Même règle que db-data : sans base, valeurs statiques ;
// base configurée mais en erreur → on logue et on relance. En ISR, Next garde
// alors la dernière page valide au lieu de mettre en cache un accueil sans ses
// chiffres, et le build échoue (le déploiement précédent reste en ligne) si une
// colonne manque — par exemple crafts_count avant scripts/migrate-crafts-count.ts.

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { dbConfigured } from "./db-data";

export type PublicSiteSettings = {
  /** « Projets menés » : événements et projets MAG, saisi dans l'admin. */
  eventsCount: number | null;
  /** « Métiers » selon la nomenclature MAG, saisi dans l'admin. */
  craftsCount: number | null;
};

/** Sans base (previews, dev statique) : « Métiers » selon la nomenclature MAG
    (Stat_GLOBALES, 01.09.2026), la valeur affichée avant la saisie admin. */
const STATIC_SETTINGS: PublicSiteSettings = { eventsCount: null, craftsCount: 53 };

export const getSiteSettings = cache(async (): Promise<PublicSiteSettings | null> => {
  if (!dbConfigured()) return STATIC_SETTINGS;
  try {
    const [row] = await db
      .select({ eventsCount: siteSettings.eventsCount, craftsCount: siteSettings.craftsCount })
      .from(siteSettings)
      .where(eq(siteSettings.id, "default"))
      .limit(1);
    return row ?? null;
  } catch (err) {
    console.error("[site-settings] lecture impossible :", err);
    throw err;
  }
});
