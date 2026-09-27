import { test } from "node:test";
import { strict as assert } from "node:assert";

// Chemin « base configurée mais en erreur », sans mock : une DATABASE_URL
// vers un port fermé (connexion refusée immédiatement). Doit être posée AVANT
// d'importer db-data, car src/db/index.ts crée le Pool à l'import.
process.env.DATABASE_URL = "postgres://u:p@127.0.0.1:1/x";

test("base configurée mais injoignable : les lectures échouent, pas de repli statique", async () => {
  const { getPublishedArtisans, getArtisanCommunes, getJemaEditions } = await import("./db-data");
  // dbError logue avant de relancer : on le fait taire le temps du test
  const error = console.error;
  // Connexion refusée (et non une autre erreur, ex. d'import)
  const refused = (e: unknown) =>
    (e as { cause?: { code?: string } })?.cause?.code === "ECONNREFUSED";
  console.error = () => {};
  try {
    await assert.rejects(getPublishedArtisans(), refused);
    await assert.rejects(getArtisanCommunes(), refused);
    await assert.rejects(getJemaEditions(), refused);
  } finally {
    console.error = error;
  }
});
