// Garde-fou (incident du 10.10.2026) : les documents de MAG déposés dans
// docs/mag-inputs (Excel des artisans, formulaire, PV) et les sauvegardes de
// backups/ contiennent des données personnelles et ne doivent JAMAIS être
// suivis par git. Une branche créée depuis un commit sans la règle .gitignore
// avait embarqué le dossier dans un commit poussé sur le dépôt public.
import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

function tracked(path: string): string[] {
  try {
    return execFileSync("git", ["ls-files", "--", path], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      .split("\n")
      .filter(Boolean);
  } catch {
    return []; // pas de git (archive, CI sans historique) : rien à vérifier
  }
}

describe("hygiène du dépôt", () => {
  test("aucun document MAG ni sauvegarde suivi par git", () => {
    assert.deepEqual(tracked("docs/mag-inputs"), []);
    assert.deepEqual(tracked("backups"), []);
  });
  test(".gitignore exclut docs/mag-inputs et backups", () => {
    const ignore = readFileSync(".gitignore", "utf8");
    assert.match(ignore, /^\/docs\/mag-inputs\/$/m);
    assert.match(ignore, /^\/backups\/$/m);
  });
});
