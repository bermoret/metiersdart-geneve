import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { findCommuneName } from "./commune-match";
import { GE_COMMUNE_NAMES, officialCommuneName } from "./ge-commune-names";

const TABLE = ["Carouge (GE)", "Genève", "Perly-Certoux", "Le Grand-Saconnex", "Vandœuvres"];

describe("findCommuneName", () => {
  test("égalité exacte, espaces ignorés", () => {
    assert.equal(findCommuneName("Genève", TABLE), "Genève");
    assert.equal(findCommuneName("  Genève ", TABLE), "Genève");
  });

  test("graphies équivalentes ramenées au nom de la liste", () => {
    assert.equal(findCommuneName("Carouge", TABLE), "Carouge (GE)");
    assert.equal(findCommuneName("Grand-Saconnex", TABLE), "Le Grand-Saconnex");
    assert.equal(findCommuneName("Vandoeuvres", TABLE), "Vandœuvres");
  });

  test("commune absente ou saisie vide", () => {
    assert.equal(findCommuneName("Lausanne", TABLE), undefined);
    // Nom d'usage : pas d'alias, la fiche doit être corrigée (« Perly-Certoux »).
    assert.equal(findCommuneName("Perly", TABLE), undefined);
    assert.equal(findCommuneName("", TABLE), undefined);
    assert.equal(findCommuneName("   ", TABLE), undefined);
  });
});

describe("officialCommuneName", () => {
  test("45 communes genevoises", () => {
    assert.equal(GE_COMMUNE_NAMES.length, 45);
  });

  test("noms existants en base acceptés malgré la graphie", () => {
    assert.equal(officialCommuneName("Carouge (GE)"), "Carouge");
    assert.equal(officialCommuneName("Vandœuvres"), "Vandoeuvres");
    assert.equal(officialCommuneName("Grand-Saconnex"), "Le Grand-Saconnex");
  });

  test("nom sans tracé refusé", () => {
    assert.equal(officialCommuneName("Annemasse"), undefined);
    assert.equal(officialCommuneName("Carouge-Centre"), undefined);
  });
});
