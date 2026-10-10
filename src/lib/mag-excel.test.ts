import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  cellToIsoDate,
  detectExit,
  excelSerialToIso,
  mapDomaine,
  matchArtisan,
  normalizeName,
  parseComment,
  parseTrainerCompany,
  poinconFromGlobal,
  splitAddress,
  splitMulti,
  surnameCase,
} from "./mag-excel";

describe("cellules Excel", () => {
  test("numéro de série → date", () => {
    assert.equal(excelSerialToIso(46266), "2026-09-01");
    assert.equal(excelSerialToIso(45658), "2025-01-01");
    assert.equal(excelSerialToIso(0), null);
    assert.equal(cellToIsoDate(new Date("2026-07-03T00:00:00Z")), "2026-07-03");
    assert.equal(cellToIsoDate("03.07.2026"), "2026-07-03");
    assert.equal(cellToIsoDate("2026-07-03"), "2026-07-03");
    assert.equal(cellToIsoDate("x"), null);
  });

  test("nom en capitales → casse normale, casse mixte gardée", () => {
    assert.equal(surnameCase("LUGRIN"), "Lugrin");
    assert.equal(surnameCase("LO BUE"), "Lo Bue");
    assert.equal(surnameCase("NEVECERAL-PANTAZOPOULOS "), "Neveceral-Pantazopoulos");
    assert.equal(surnameCase("CAVALLO NAZY GARGARY"), "Cavallo Nazy Gargary");
    assert.equal(surnameCase("de Los Santos"), "de Los Santos");
    assert.equal(surnameCase(""), null);
  });

  test("adresse multi-lignes", () => {
    assert.deepEqual(splitAddress("Route de Satigny 42\nBatiment Elsa\n2ieme etage\n1242 Satigny"), {
      street: "Route de Satigny 42, Batiment Elsa, 2ieme etage", postalCode: "1242", city: "Satigny",
    });
    assert.deepEqual(splitAddress("Rue François-Perréard 4\n1225 Chêne-Bourg"), { street: "Rue François-Perréard 4", postalCode: "1225", city: "Chêne-Bourg" });
    assert.deepEqual(splitAddress("Rue de la Terrassière 11"), { street: "Rue de la Terrassière 11", postalCode: null, city: null });
    assert.deepEqual(splitAddress(""), { street: null, postalCode: null, city: null });
  });

  test("téléphones et mails multiples", () => {
    assert.deepEqual(splitMulti("contact@bespoak.ch\njasonlugrin@gmail.com"), { first: "contact@bespoak.ch", others: ["jasonlugrin@gmail.com"] });
    assert.deepEqual(splitMulti("022 301 56 37 / 079 598 87 16 (Corinne Viollet)"), { first: "022 301 56 37", others: ["079 598 87 16 (Corinne Viollet)"] });
    assert.deepEqual(splitMulti(null), { first: null, others: [] });
  });

  test("commentaires datés", () => {
    assert.deepEqual(parseComment("07.02.24 : adresse mail MàJ suite au tél."), { occurredAt: "2024-02-07", text: "adresse mail MàJ suite au tél." });
    assert.deepEqual(parseComment("19.09.2023 : ont fait faillite en date du 28.02.2023"), { occurredAt: "2023-09-19", text: "ont fait faillite en date du 28.02.2023" });
    assert.deepEqual(parseComment("11.25 : changement commune"), { occurredAt: "2025-11-01", text: "changement commune" });
    assert.deepEqual(parseComment("16.07.25: Activité en suspens"), { occurredAt: "2025-07-16", text: "Activité en suspens" });
    assert.deepEqual(parseComment("Oct 25 : appel avec Elsa"), { occurredAt: "2025-10-01", text: "appel avec Elsa" });
    assert.deepEqual(parseComment("Ebeniste CFC 1996"), { occurredAt: null, text: "Ebeniste CFC 1996" });
    assert.deepEqual(parseComment("99.99.25 : impossible"), { occurredAt: null, text: "impossible" });
    assert.deepEqual(parseComment(""), { occurredAt: null, text: "" });
  });

  test("motif de sortie", () => {
    assert.equal(detectExit("ont fait faillite en date du 28.02.2023"), "faillite");
    assert.equal(detectExit("Fin d'activité, départ à la retraite"), "retraite");
    assert.equal(detectExit("En liquidation, ne répond plus au tel"), "fermeture_atelier");
    assert.equal(detectExit("Part à l'étranger, il nous informera"), "depart");
    assert.equal(detectExit("a accepté de se retirer du catalogue car pas métier d'art"), "retrait_catalogue");
    assert.equal(detectExit("Activité en suspens pour restructuration. Devrait revenir"), null);
    assert.equal(detectExit("Laureate Prix de l'artisanat 2025"), null);
    assert.equal(detectExit("changement propio de NOVEL Lisa à NAVILLE PERRIARD Elise"), null);
    assert.equal(detectExit(""), null);
  });

  test("domaines, entreprise formatrice, poinçon GLOBAL", () => {
    const cats = ["Art de l'horlogerie et de la bijouterie", "Art de la conservation et de la restauration", "Arts appliqués", "Art du bois"];
    assert.equal(mapDomaine("Art de l'horlogerie / bijouterie", cats), "Art de l'horlogerie et de la bijouterie");
    assert.equal(mapDomaine("Art de la conservation et restauration", cats), "Art de la conservation et de la restauration");
    assert.equal(mapDomaine("Arts appliqués", cats), "Arts appliqués");
    assert.equal(mapDomaine("Art du bois", cats), "Art du bois");
    assert.equal(mapDomaine("Art du vide", cats), null);
    assert.equal(mapDomaine("", cats), null);
    assert.deepEqual(parseTrainerCompany("OUI"), { trainerCompany: true, note: null });
    assert.deepEqual(parseTrainerCompany("OUI. 26.01.26 SM : à faire valider par OFPC"), { trainerCompany: true, note: "26.01.26 SM : à faire valider par OFPC" });
    assert.deepEqual(parseTrainerCompany("NON"), { trainerCompany: false, note: null });
    assert.deepEqual(parseTrainerCompany(""), { trainerCompany: null, note: null });
    assert.equal(poinconFromGlobal("X", "", ""), "ATELIER");
    assert.equal(poinconFromGlobal("", "x", ""), "BOUTIQUE");
    assert.equal(poinconFromGlobal(null, undefined, "X"), "ENTREPRISE");
    assert.equal(poinconFromGlobal("", "", ""), null);
  });
});

describe("rapprochement Excel ↔ fiches", () => {
  const fiches = [
    { id: "1", name: "Bespoak — Jason Lugrin", slug: "bespoak" },
    { id: "2", name: "Rosso encadrements", slug: "rosso" },
    { id: "3", name: "Denis Schott & Fille", slug: "schott" },
    { id: "4", name: "Art & Maison SA", slug: "art-maison" },
    { id: "5", name: "Atelier Dupont — Marie Dupont", slug: "dupont-1" },
    { id: "6", name: "Jean Dupont", slug: "dupont-2" },
    { id: "7", name: "Artisan du Staff", slug: "staff" },
  ];
  test("nom + prénom", () => {
    assert.deepEqual(matchArtisan({ lastName: "LUGRIN", firstName: "Jason", workshopName: "Bespoak" }, fiches), { kind: "nom_prenom", fiche: fiches[0] });
    assert.deepEqual(matchArtisan({ lastName: "Dupont", firstName: "Jean", workshopName: null }, fiches), { kind: "nom_prenom", fiche: fiches[5] });
  });
  test("raison sociale (≥ 4 caractères), ponctuation ignorée", () => {
    assert.deepEqual(matchArtisan({ lastName: "ROSSO", firstName: "Pierre", workshopName: "Rosso encadrements" }, fiches), { kind: "raison_sociale", fiche: fiches[1] });
    assert.deepEqual(matchArtisan({ lastName: "LO BUE", firstName: "Giovanni", workshopName: "Art & Maison SA" }, fiches), { kind: "raison_sociale", fiche: fiches[3] });
    assert.deepEqual(matchArtisan({ lastName: "SHABANI", firstName: "Ismet", workshopName: "Artisan du Staff" }, fiches), { kind: "raison_sociale", fiche: fiches[6] });
    assert.deepEqual(matchArtisan({ lastName: "X", firstName: "Y", workshopName: "Art" }, fiches), { kind: "aucun" });
  });
  test("nom seul dans une unique fiche → à confirmer ; plusieurs → ambigu", () => {
    assert.deepEqual(matchArtisan({ lastName: "SCHOTT", firstName: "Marie", workshopName: "Schott encadreur Sàrl" }, fiches), { kind: "nom_seul", fiche: fiches[2] });
    const amb = matchArtisan({ lastName: "DUPONT", firstName: "Luc", workshopName: null }, fiches);
    assert.equal(amb.kind, "ambigu");
    if (amb.kind === "ambigu") assert.deepEqual(amb.candidates.map((c) => c.id), ["5", "6"]);
  });
  test("mots entiers seulement (« Art » ne matche pas « Artisan »)", () => {
    assert.deepEqual(matchArtisan({ lastName: "Art", firstName: null, workshopName: null }, [fiches[6]]), { kind: "aucun" });
    assert.deepEqual(matchArtisan({ lastName: "Staf", firstName: null, workshopName: null }, [fiches[6]]), { kind: "aucun" });
    assert.equal(normalizeName("Chêne-Bourg (GE)"), "chene bourg ge");
  });
  test("aucune donnée → aucun", () => {
    assert.deepEqual(matchArtisan({ lastName: null, firstName: null, workshopName: null }, fiches), { kind: "aucun" });
  });
});
