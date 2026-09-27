/**
 * Corrige la commune « Perly » des fiches artisans en « Perly-Certoux », le nom
 * officiel de la table `communes` (fiche attendue : marina-buckel).
 *
 * Contexte : `communeKey` (src/lib/utils.ts) porte un alias « Perly » → Perly-Certoux pour
 * que la fiche apparaisse sur la carte ; le filtre commune du répertoire affiche
 * pourtant « Perly ». Une fois la donnée corrigée, l'alias peut être retiré
 * (voir docs/FOLLOW-UP.md, 24.09).
 *
 * Ne touche QUE les fiches dont la commune vaut exactement « Perly » ; refuse
 * d'écrire si « Perly-Certoux » n'existe pas dans `communes`.
 *
 * Usage :
 *   npx tsx scripts/fix-perly-commune.ts          → à blanc (transaction en lecture seule)
 *   npx tsx scripts/fix-perly-commune.ts --apply  → écrit, en une transaction
 * Connexion à l'endpoint direct de Neon : scripts/lib/db-script.ts.
 */
import { apply, runDbScript } from "./lib/db-script";

const FROM = "Perly";
const TO = "Perly-Certoux";

type Row = { id: string; slug: string; name: string; commune: string };

runDbScript({
  async run(client) {
    const { rows: target } = await client.query<{ slug: string }>(
      "SELECT slug FROM communes WHERE name = $1",
      [TO],
    );
    if (!target[0]) {
      throw new Error(`Commune « ${TO} » absente de la table communes : rien écrit.`);
    }
    console.log(`Commune « ${TO} » : présente (slug ${target[0].slug})`);

    const { rows } = await client.query<Row>(
      "SELECT id, slug, name, commune FROM artisans WHERE commune = $1 ORDER BY slug",
      [FROM],
    );
    for (const r of rows) console.log(`  ${r.slug} — ${r.name}`);
    console.log(`${rows.length} fiche(s) en « ${FROM} ».`);

    if (!apply) {
      if (rows.length) console.log(`À blanc : commune → « ${TO} ». Relancer avec --apply pour écrire.`);
      return [];
    }

    const res = await client.query<Row>(
      `UPDATE artisans SET commune = $2, updated_at = now()
        WHERE commune = $1
        RETURNING id, slug, name, commune`,
      [FROM, TO],
    );
    return res.rows;
  },
  afterCommit(_client, changed) {
    for (const r of changed) console.log(`  modifiée : ${r.slug} → ${r.commune}`);
    console.log(`Appliqué : ${changed.length} fiche(s) passée(s) en « ${TO} ».`);
  },
});
