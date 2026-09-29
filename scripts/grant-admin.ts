/**
 * Donne le rôle admin à un compte existant (table `user` d'Auth.js).
 * Le compte doit s'être connecté une fois par lien magique : sans ligne en base,
 * rien n'est créé.
 *
 * Usage :
 *   npx tsx scripts/grant-admin.ts --email contact@metiersdart-geneve.ch          → à blanc
 *   npx tsx scripts/grant-admin.ts --email contact@metiersdart-geneve.ch --apply  → écrit
 * Connexion à l'endpoint direct de Neon : scripts/lib/db-script.ts.
 */
import { apply, argValue, runDbScript } from "./lib/db-script";

const email = argValue("--email")?.trim().toLowerCase();
if (!email) {
  console.error("--email requis");
  process.exit(1);
}

runDbScript({
  lockTimeout: "5s",
  async run(client) {
    const found = await client.query<{ role: string }>(
      `SELECT role FROM "user" WHERE lower(email) = $1`,
      [email],
    );
    if (found.rowCount === 0) {
      console.log(`Aucun compte pour ${email} : se connecter une fois sur /auth/signin d'abord.`);
      return 0;
    }
    const role = found.rows[0].role;
    if (role === "admin") {
      console.log(`${email} est déjà admin.`);
      return 0;
    }
    if (!apply) {
      console.log(`à écrire  ${email} : ${role} → admin. Relancer avec --apply pour écrire.`);
      return 0;
    }
    const res = await client.query(
      `UPDATE "user" SET role = 'admin' WHERE lower(email) = $1 AND role <> 'admin'`,
      [email],
    );
    console.log(`écrit  ${email} : ${role} → admin — ${res.rowCount} ligne(s)`);
    return res.rowCount ?? 0;
  },
});
