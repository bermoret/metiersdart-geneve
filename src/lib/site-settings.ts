// Paramètres saisis par MAG dans l'admin (table singleton site_settings),
// lus côté public. Une panne de lecture ne doit pas faire tomber la page qui
// les affiche : on retourne null et la page se passe du chiffre.

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { dbConfigured } from "./db-data";

export type PublicSiteSettings = {
  /** « Projets menés » : événements et projets MAG, saisi dans l'admin. */
  eventsCount: number | null;
};

export const getSiteSettings = cache(async (): Promise<PublicSiteSettings | null> => {
  if (!dbConfigured()) return null;
  try {
    const [row] = await db
      .select({ eventsCount: siteSettings.eventsCount })
      .from(siteSettings)
      .where(eq(siteSettings.id, "default"))
      .limit(1);
    return row ?? null;
  } catch (err) {
    console.error("[site-settings] lecture impossible :", err);
    return null;
  }
});
