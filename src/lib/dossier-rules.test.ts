import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  addressChangeText,
  availableActions,
  composeAddress,
  composePublicName,
  ficheFromDossier,
  nextStatus,
  todayZurich,
  uniqueSlug,
} from "./dossier-rules";

describe("transitions de statut", () => {
  test("éligible seulement depuis en_evaluation", () => {
    assert.equal(nextStatus("en_evaluation", "eligible"), "eligible");
    assert.equal(nextStatus("eligible", "eligible"), null);
    assert.equal(nextStatus("actif", "eligible"), null);
  });
  test("activer depuis eligible ou desactive, pas depuis en_evaluation", () => {
    assert.equal(nextStatus("eligible", "activate"), "actif");
    assert.equal(nextStatus("desactive", "activate"), "actif");
    assert.equal(nextStatus("en_evaluation", "activate"), null);
    assert.equal(nextStatus("actif", "activate"), null);
  });
  test("désactiver depuis tout sauf desactive", () => {
    for (const s of ["en_evaluation", "eligible", "actif"] as const) assert.equal(nextStatus(s, "deactivate"), "desactive");
    assert.equal(nextStatus("desactive", "deactivate"), null);
  });
  test("boutons proposés", () => {
    assert.deepEqual(availableActions("en_evaluation").map((a) => a.action), ["eligible", "deactivate"]);
    assert.deepEqual(availableActions("eligible").map((a) => a.action), ["activate", "deactivate"]);
    assert.deepEqual(availableActions("actif").map((a) => a.action), ["deactivate"]);
    assert.deepEqual(availableActions("desactive"), [{ action: "activate", label: "Réactiver" }]);
  });
});

describe("nom public et adresse", () => {
  test("atelier — prénom nom, ou l'un des deux", () => {
    assert.equal(composePublicName({ firstName: "Jason", lastName: "Lugrin", workshopName: "Bespoak" }), "Bespoak — Jason Lugrin");
    assert.equal(composePublicName({ firstName: "Sylvio", lastName: "Asseo" }), "Sylvio Asseo");
    assert.equal(composePublicName({ workshopName: " Rosso encadrements " }), "Rosso encadrements");
    assert.equal(composePublicName({ lastName: "Estevez" }), "Estevez");
    assert.equal(composePublicName({}), "");
  });
  test("adresse composée", () => {
    assert.equal(composeAddress({ street: "Rue de la Synagogue 32", postalCode: "1204", city: "Genève" }), "Rue de la Synagogue 32, 1204 Genève");
    assert.equal(composeAddress({ street: "Route de Satigny 42" }), "Route de Satigny 42");
    assert.equal(composeAddress({ postalCode: "1242", city: "Satigny" }), "1242 Satigny");
    assert.equal(composeAddress({}), null);
  });
});

describe("fiche publique depuis le dossier", () => {
  const base = {
    firstName: "Jason", lastName: "Lugrin", workshopName: "Bespoak", craft: "Menuisier", categoryId: "cat-1",
    commune: "Satigny", street: "Route de Satigny 42", postalCode: "1242", city: "Satigny",
    phone: "078 303 42 32", email: "contact@bespoak.ch", website: "https://bespoak.ch",
    socialLinks: { instagram: "https://instagram.com/bespoak" }, poinconType: "ATELIER",
  };
  test("avec consentement : coordonnées copiées, fiche non publiée", () => {
    const f = ficheFromDossier({ ...base, contactPublicConsent: true });
    assert.ok(!("error" in f));
    if ("error" in f) return;
    assert.equal(f.name, "Bespoak — Jason Lugrin");
    assert.equal(f.phone, "078 303 42 32");
    assert.equal(f.email, "contact@bespoak.ch");
    assert.equal(f.address, "Route de Satigny 42, 1242 Satigny");
    assert.equal(f.published, false);
    assert.equal(f.jemaParticipant, false);
    assert.equal(f.type, "artisan");
    assert.deepEqual(f.socialLinks, { instagram: "https://instagram.com/bespoak" });
  });
  test("sans consentement (false ou non renseigné) : ni téléphone ni mail", () => {
    for (const consent of [false, null, undefined]) {
      const f = ficheFromDossier({ ...base, contactPublicConsent: consent });
      assert.ok(!("error" in f));
      if ("error" in f) return;
      assert.equal(f.phone, null);
      assert.equal(f.email, null);
      assert.equal(f.website, "https://bespoak.ch");
    }
  });
  test("sans nom : erreur", () => {
    const f = ficheFromDossier({ craft: "Menuisier" });
    assert.ok("error" in f);
  });
  test("réseaux vides → null", () => {
    const f = ficheFromDossier({ lastName: "X", socialLinks: {} });
    if (!("error" in f)) assert.equal(f.socialLinks, null);
  });
});

describe("slug unique et journal", () => {
  test("suffixe numérique si pris", () => {
    assert.equal(uniqueSlug("Bespoak — Jason Lugrin", new Set()), "bespoak-jason-lugrin");
    assert.equal(uniqueSlug("Bespoak — Jason Lugrin", new Set(["bespoak-jason-lugrin"])), "bespoak-jason-lugrin-2");
    assert.equal(uniqueSlug("Bespoak", new Set(["bespoak", "bespoak-2"])), "bespoak-3");
    assert.equal(uniqueSlug("***", new Set()), "artisan");
  });
  test("texte de changement d'adresse", () => {
    assert.equal(addressChangeText("Rue A 1", "Rue B 2"), "Adresse modifiée : Rue A 1 → Rue B 2");
    assert.equal(addressChangeText(null, "Rue B 2"), "Adresse modifiée : (aucune) → Rue B 2");
  });
  test("date du jour en Suisse", () => {
    assert.equal(todayZurich(new Date("2026-03-29T23:30:00Z")), "2026-03-30");
    assert.equal(todayZurich(new Date("2026-10-10T05:00:00Z")), "2026-10-10");
  });
});
