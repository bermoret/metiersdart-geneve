import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  addressLines,
  cartographyHeader,
  colLetter,
  commentsCell,
  countaFormula,
  distinctCrafts,
  excelDate,
  excelDomaineLabel,
  excelSurname,
  globalName,
  lastUpdateLabel,
  shortDate,
  sortFr,
  splitCrafts,
  trainerCell,
} from "./excel-export-rules";

describe("export Excel : libellés", () => {
  test("domaines : graphie du classeur", () => {
    assert.equal(excelDomaineLabel("Art de l'horlogerie et de la bijouterie"), "Art de l'horlogerie / bijouterie");
    assert.equal(excelDomaineLabel("Art de la conservation et de la restauration"), "Art de la conservation et restauration");
    assert.equal(excelDomaineLabel("Art du bois"), "Art du bois");
    assert.equal(excelDomaineLabel(null), null);
    assert.equal(cartographyHeader("Art de l'horlogerie et de la bijouterie"), "ART DE L'HORLOGERIE ET DE LA BIJOUTERIE");
    assert.equal(cartographyHeader("Arts appliqués"), "ARTS APPLIQUES");
  });
  test("nom en capitales, nom GLOBAL", () => {
    assert.equal(excelSurname(" Lugrin "), "LUGRIN");
    assert.equal(excelSurname(""), null);
    assert.equal(globalName({ lastName: "Archinard", firstName: "Béatrice" }, "Béatrice Archinard"), "ARCHINARD Béatrice");
    assert.equal(globalName({ lastName: null, firstName: null, workshopName: "Art & Maison SA" }, "Art & Maison SA"), "Art & Maison SA");
    assert.equal(globalName({}, "Fiche"), "Fiche");
    assert.equal(globalName({ lastName: "Asseo" }, null), "ASSEO");
  });
  test("dates", () => {
    assert.equal(shortDate("2026-10-10"), "10.10.26");
    assert.equal(shortDate(new Date("2024-02-07T00:00:00Z")), "07.02.24");
    assert.equal(lastUpdateLabel("2026-10-10"), "Dernière MàJ : 10.10.26");
    assert.equal(excelDate("2026-09-01")?.toISOString(), "2026-09-01T00:00:00.000Z");
    assert.equal(excelDate(null), null);
    assert.equal(excelDate("x"), null);
  });
  test("adresse, commentaires, entreprise formatrice", () => {
    assert.equal(addressLines({ street: "Route de Satigny 42", postalCode: "1242", city: "Satigny" }), "Route de Satigny 42\n1242 Satigny");
    assert.equal(addressLines({ street: "Rue X 1" }), "Rue X 1");
    assert.equal(addressLines({}), null);
    assert.equal(
      commentsCell([
        { occurredAt: "2024-02-07", text: "adresse mail MàJ", type: "remarque" },
        { occurredAt: "2025-11-01", text: "changement  commune", type: "remarque" },
        { occurredAt: "2025-12-01", text: "activé", type: "activation" },
      ]),
      "01.11.25 : changement commune\n07.02.24 : adresse mail MàJ",
    );
    assert.equal(commentsCell([]), null);
    assert.equal(trainerCell(true, null), "OUI");
    assert.equal(trainerCell(true, "à faire valider par OFPC"), "OUI. à faire valider par OFPC");
    assert.equal(trainerCell(false, null), "NON");
    assert.equal(trainerCell(null, "x"), null);
  });
  test("formules et colonnes", () => {
    assert.equal(countaFormula("A", 4, 117), "COUNTA(A4:A117)");
    assert.equal(countaFormula("B", 4, 2), "COUNTA(B4:B4)");
    assert.equal(colLetter(1), "A");
    assert.equal(colLetter(26), "Z");
    assert.equal(colLetter(27), "AA");
    assert.deepEqual(sortFr(["Émile", "zoé", "Anne", "éric"]), ["Anne", "Émile", "éric", "zoé"]);
  });
  test("métiers distincts", () => {
    assert.deepEqual(splitCrafts("Bijoutier · Joaillier · Sertisseur"), ["Bijoutier", "Joaillier", "Sertisseur"]);
    assert.deepEqual(splitCrafts("Bottière • Cordonnière"), ["Bottière", "Cordonnière"]);
    assert.deepEqual(splitCrafts("Tailleur / Couturier"), ["Tailleur", "Couturier"]);
    assert.deepEqual(splitCrafts(null), []);
    assert.deepEqual(distinctCrafts(["Bijoutier · Joaillier", "bijoutier", "Joaillière", "Ébéniste", "Ebéniste"]), ["Bijoutier", "Ébéniste", "Joaillier", "Joaillière"]);
  });
});
