import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  DOSSIER_FIELDS,
  DOSSIER_SECTIONS,
  DOSSIER_STATUSES,
  JOURNAL_TYPES,
  MANUAL_JOURNAL_TYPES,
  isIsoDate,
  isUuid,
  sanitizeDossierPatch,
} from "./dossier-fields";

const UUID = "3f2a9c1e-5b7d-4e8f-9a0b-1c2d3e4f5a6b";

describe("spécification du formulaire", () => {
  test("clés uniques, showIf pointe vers un booléen existant", () => {
    const keys = DOSSIER_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
    assert.equal(new Set(keys).size, keys.length);
    for (const f of DOSSIER_FIELDS.values()) {
      if (f.showIf) assert.equal(DOSSIER_FIELDS.get(f.showIf)?.kind, "bool", f.key);
      if (f.kind === "select") assert.ok(f.options && f.options.length > 0, f.key);
    }
  });

  test("les champs de statut et de sortie ne sont pas dans le formulaire", () => {
    for (const k of ["status", "artisanId", "deactivatedAt", "deactivationReason", "createdBy", "id"]) {
      assert.equal(DOSSIER_FIELDS.has(k), false, k);
    }
  });

  test("statuts et types de journal", () => {
    assert.deepEqual(DOSSIER_STATUSES.map((s) => s.value), ["en_evaluation", "eligible", "actif", "desactive"]);
    assert.equal(JOURNAL_TYPES.length, 6);
    assert.deepEqual([...MANUAL_JOURNAL_TYPES], ["remarque", "changement_adresse", "fermeture"]);
  });
});

describe("isIsoDate / isUuid", () => {
  test("dates valides seulement", () => {
    assert.equal(isIsoDate("2026-10-10"), true);
    assert.equal(isIsoDate("2024-02-29"), true);
    assert.equal(isIsoDate("2026-02-30"), false);
    assert.equal(isIsoDate("2026-13-01"), false);
    assert.equal(isIsoDate("10.10.2026"), false);
    assert.equal(isIsoDate("1899-12-31"), false);
    assert.equal(isIsoDate(20261010), false);
  });
  test("uuid", () => {
    assert.equal(isUuid(UUID), true);
    assert.equal(isUuid(UUID.toUpperCase()), true);
    assert.equal(isUuid("abc"), false);
    assert.equal(isUuid(null), false);
  });
});

describe("sanitizeDossierPatch", () => {
  test("corps non objet refusé", () => {
    assert.deepEqual(sanitizeDossierPatch(null), { ok: false, error: "Corps JSON attendu" });
    assert.equal(sanitizeDossierPatch([]).ok, false);
    assert.equal(sanitizeDossierPatch("x").ok, false);
  });

  test("clé hors formulaire refusée (statut, artisanId, inconnue)", () => {
    for (const body of [{ status: "actif" }, { artisanId: UUID }, { deactivatedAt: "2026-01-01" }, { foo: 1 }]) {
      const r = sanitizeDossierPatch(body);
      assert.equal(r.ok, false);
      if (!r.ok) assert.match(r.error, /Champ inconnu/);
    }
  });

  test("textes : trim, vide → null, longueur bornée", () => {
    const r = sanitizeDossierPatch({ firstName: "  Jason ", lastName: "", notes: "x".repeat(20000) });
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.patch, { firstName: "Jason", lastName: null, notes: "x".repeat(20000) });
    assert.equal(sanitizeDossierPatch({ firstName: "x".repeat(256) }).ok, false);
    assert.equal(sanitizeDossierPatch({ notes: "x".repeat(20001) }).ok, false);
    assert.equal(sanitizeDossierPatch({ firstName: 12 }).ok, false);
  });

  test("booléens tri-état", () => {
    const r = sanitizeDossierPatch({ inmaRecognized: true, asmaMember: false, selfTaught: null, mainIncome: "" });
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.patch, { inmaRecognized: true, asmaMember: false, selfTaught: null, mainIncome: null });
    assert.equal(sanitizeDossierPatch({ inmaRecognized: "oui" }).ok, false);
    assert.equal(sanitizeDossierPatch({ inmaRecognized: 1 }).ok, false);
  });

  test("entiers : 0..100000, chaîne numérique acceptée", () => {
    const r = sanitizeDossierPatch({ classVisitsMin: 5, classVisitsMax: "12", publicVisitsMin: "" });
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.patch, { classVisitsMin: 5, classVisitsMax: 12, publicVisitsMin: null });
    for (const bad of [-1, 1.5, "abc", 100001, true]) assert.equal(sanitizeDossierPatch({ classVisitsMin: bad }).ok, false, String(bad));
  });

  test("dates, select, domaine", () => {
    const ok = sanitizeDossierPatch({ workshopVisitAt: "2026-10-09", poinconType: "ATELIER", categoryId: UUID, integratedAt: null });
    assert.ok(ok.ok);
    if (ok.ok) assert.deepEqual(ok.patch, { workshopVisitAt: "2026-10-09", poinconType: "ATELIER", categoryId: UUID, integratedAt: null });
    assert.equal(sanitizeDossierPatch({ workshopVisitAt: "09.10.2026" }).ok, false);
    assert.equal(sanitizeDossierPatch({ poinconType: "INSTITUTION" }).ok, false);
    assert.equal(sanitizeDossierPatch({ categoryId: "not-a-uuid" }).ok, false);
  });

  test("réseaux sociaux : URL http(s) seulement, noms normalisés", () => {
    const r = sanitizeDossierPatch({ socialLinks: { Instagram: " https://instagram.com/x ", facebook: "" } });
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.patch, { socialLinks: { instagram: "https://instagram.com/x" } });
    assert.equal(sanitizeDossierPatch({ socialLinks: { instagram: "javascript:alert(1)" } }).ok, false);
    assert.equal(sanitizeDossierPatch({ socialLinks: { instagram: "@handle" } }).ok, false);
    assert.equal(sanitizeDossierPatch({ socialLinks: "https://x" }).ok, false);
    // une clé « error » légitime n'est pas prise pour une erreur
    const e = sanitizeDossierPatch({ socialLinks: { error: "https://example.org/e" } });
    assert.ok(e.ok);
    if (e.ok) assert.deepEqual(e.patch, { socialLinks: { error: "https://example.org/e" } });
  });

  test("extra : objet plat borné", () => {
    const r = sanitizeDossierPatch({ extra: { "Question ajoutée": "oui", nb: 3, ok: true, vide: null } });
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.patch, { extra: { "Question ajoutée": "oui", nb: 3, ok: true, vide: null } });
    assert.equal(sanitizeDossierPatch({ extra: { a: { nested: 1 } } }).ok, false);
    assert.equal(sanitizeDossierPatch({ extra: { a: [1] } }).ok, false);
    assert.equal(sanitizeDossierPatch({ extra: { "": 1 } }).ok, false);
    const many = Object.fromEntries(Array.from({ length: 51 }, (_, i) => [`k${i}`, 1]));
    assert.equal(sanitizeDossierPatch({ extra: many }).ok, false);
    assert.equal(sanitizeDossierPatch({ extra: { a: "x".repeat(2001) } }).ok, false);
    const e = sanitizeDossierPatch({ extra: { error: "texte" } });
    assert.ok(e.ok);
    if (e.ok) assert.deepEqual(e.patch, { extra: { error: "texte" } });
  });

  test("patch vide accepté", () => {
    assert.deepEqual(sanitizeDossierPatch({}), { ok: true, patch: {} });
  });
});
