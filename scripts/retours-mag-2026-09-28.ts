/**
 * Données du retour de MAG du 28.09.2026 (mail « Re: MAG: Retour nouveau site internet ») :
 *
 * - JEMA 2022 : dates du 1er au 3 avril 2022 (posées seulement si vides) ;
 * - Orthethic n'a jamais participé aux JEMA : mention retirée
 *   (Marina Buckel et Atelier ABR : déjà cochés) ;
 * - Maïa Kvasnikova, en recherche de locaux : retirée des cartes (coordonnées
 *   vidées ; la carte d'accueil et sa fiche écartent les coordonnées NULL).
 *   Son adresse est gardée : l'admin ne la re-géocode que si elle est modifiée.
 *
 * Chaque UPDATE répète l'état attendu dans son WHERE : une saisie faite entre-temps
 * dans l'admin n'est jamais écrasée.
 *
 * Usage :
 *   npx tsx scripts/retours-mag-2026-09-28.ts          → à blanc (transaction en lecture seule)
 *   npx tsx scripts/retours-mag-2026-09-28.ts --apply  → écrit, en une transaction
 * Connexion à l'endpoint direct de Neon : scripts/lib/db-script.ts.
 */
import { apply, runDbScript } from "./lib/db-script";

type Change = { label: string; rows: number };

runDbScript({
  lockTimeout: "5s",
  async run(client) {
    const changes: Change[] = [];
    const step = async (label: string, sql: string, params: unknown[]) => {
      // À blanc, la même requête en SELECT compte les lignes visées.
      const res = await client.query(sql, params);
      changes.push({ label, rows: res.rowCount ?? 0 });
    };

    if (apply) {
      await step(
        "JEMA 2022 : 1er – 3 avril 2022",
        `UPDATE jema_editions SET start_date = '2022-04-01 00:00:00', end_date = '2022-04-03 00:00:00',
                updated_at = now()
          WHERE year = 2022 AND start_date IS NULL AND end_date IS NULL`,
        [],
      );
      await step(
        "Orthethic : mention JEMA retirée",
        `UPDATE artisans SET jema_participant = false, updated_at = now()
          WHERE slug = 'orthethic' AND jema_participant = true`,
        [],
      );
      await step(
        "Maïa Kvasnikova : retirée des cartes",
        `UPDATE artisans SET latitude = NULL, longitude = NULL, updated_at = now()
          WHERE slug = 'maia-kvasnikova' AND latitude IS NOT NULL`,
        [],
      );
    } else {
      await step(
        "JEMA 2022 : 1er – 3 avril 2022",
        "SELECT 1 FROM jema_editions WHERE year = 2022 AND start_date IS NULL AND end_date IS NULL",
        [],
      );
      await step(
        "Orthethic : mention JEMA retirée",
        "SELECT 1 FROM artisans WHERE slug = 'orthethic' AND jema_participant = true",
        [],
      );
      await step(
        "Maïa Kvasnikova : retirée des cartes",
        "SELECT 1 FROM artisans WHERE slug = 'maia-kvasnikova' AND latitude IS NOT NULL",
        [],
      );
    }

    for (const c of changes) {
      console.log(`${apply ? "écrit" : "à écrire"}  ${c.label} — ${c.rows} ligne(s)`);
    }
    if (!apply) console.log("À blanc. Relancer avec --apply pour écrire.");
    return changes;
  },
  afterCommit(_client, changes) {
    const total = changes.reduce((n, c) => n + c.rows, 0);
    console.log(`Appliqué : ${total} ligne(s) modifiée(s).`);
  },
});
