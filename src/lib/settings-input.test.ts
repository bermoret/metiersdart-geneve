import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { parseSettingsInput } from "./settings-input";
import { PG_INT_MAX } from "./utils";

describe("parseSettingsInput", () => {
  test("mot de passe seul : ni projets ni métiers dans le patch (plus de remise à 0)", () => {
    const result = parseSettingsInput({ communautePassword: "  MAG 2026  " });
    assert.deepEqual(result, { patch: { communautePassword: "MAG 2026" } });
    assert.ok("patch" in result);
    assert.equal("eventsCount" in result.patch, false);
    assert.equal("craftsCount" in result.patch, false);
  });

  test("chiffres seuls : le mot de passe n'est pas touché", () => {
    assert.deepEqual(parseSettingsInput({ eventsCount: 37 }), { patch: { eventsCount: 37 } });
    assert.deepEqual(parseSettingsInput({ craftsCount: 0, eventsCount: PG_INT_MAX }), {
      patch: { craftsCount: 0, eventsCount: PG_INT_MAX },
    });
  });

  test("mot de passe tronqué à 255 caractères", () => {
    const result = parseSettingsInput({ communautePassword: "x".repeat(300) });
    assert.ok("patch" in result);
    assert.equal(result.patch.communautePassword?.length, 255);
  });

  test("chiffres invalides refusés", () => {
    for (const bad of [-1, 1.5, PG_INT_MAX + 1, "12", null, NaN]) {
      const result = parseSettingsInput({ eventsCount: bad });
      assert.ok("error" in result, `eventsCount ${String(bad)}`);
      assert.match(result.error, /entiers entre 0 et/);
      assert.ok("error" in parseSettingsInput({ craftsCount: bad }), `craftsCount ${String(bad)}`);
    }
  });

  test("un chiffre invalide refuse toute la requête, même avec un mot de passe", () => {
    assert.ok("error" in parseSettingsInput({ communautePassword: "MAG", craftsCount: -3 }));
  });

  test("corps vide ou sans champ utile", () => {
    for (const body of [{}, { communautePassword: "   " }, { communautePassword: 42 }, { autre: 1 }]) {
      assert.deepEqual(parseSettingsInput(body), { error: "Aucun paramètre à modifier" });
    }
  });

  test("corps qui n'est pas un objet", () => {
    for (const body of [null, undefined, "texte", 3, [1, 2]]) {
      assert.deepEqual(parseSettingsInput(body), { error: "Requête invalide" });
    }
  });
});
