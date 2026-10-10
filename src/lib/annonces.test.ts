import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  ANNONCE_CATEGORIES,
  annoncePhotoPathname,
  detectImageType,
  isAnnonceCategory,
  parseAnnonceEdit,
  parseAnnonceInput,
} from "./annonces";

describe("annonces : catégories", () => {
  test("liste fermée", () => {
    assert.equal(isAnnonceCategory("Entraide"), true);
    assert.equal(isAnnonceCategory("entraide"), false);
    assert.equal(isAnnonceCategory("Autre"), false);
    assert.equal(isAnnonceCategory(null), false);
    assert.equal(ANNONCE_CATEGORIES.length, 9);
  });
});

describe("annonces : soumission", () => {
  const ok = { title: " Établi à vendre ", category: "Vente de matériel", authorName: "Jean", authorEmail: "jean@example.org", content: "Bon état.\r\nPrix à discuter." };
  test("champs nettoyés", () => {
    const r = parseAnnonceInput(ok);
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.value, { title: "Établi à vendre", category: "Vente de matériel", authorName: "Jean", authorEmail: "jean@example.org", content: "Bon état.\nPrix à discuter." });
  });
  test("requis, catégorie, e-mail, longueurs", () => {
    assert.equal(parseAnnonceInput({ ...ok, title: "" }).ok, false);
    assert.equal(parseAnnonceInput({ ...ok, category: "Autre" }).ok, false);
    assert.equal(parseAnnonceInput({ ...ok, authorEmail: "pas un mail" }).ok, false);
    assert.equal(parseAnnonceInput({ ...ok, authorEmail: "" }).ok, true);
    assert.equal(parseAnnonceInput({ ...ok, content: "x".repeat(10_001) }).ok, false);
    assert.equal(parseAnnonceInput({ ...ok, title: "x".repeat(501) }).ok, false);
    assert.equal(parseAnnonceInput(null).ok, false);
    assert.equal(parseAnnonceInput({ ...ok, title: 42 }).ok, false);
  });
});

describe("annonces : modification admin", () => {
  test("seuls les champs présents, bornés", () => {
    const r = parseAnnonceEdit({ title: " Nouveau titre ", authorEmail: "" });
    assert.ok(r.ok);
    if (r.ok) assert.deepEqual(r.patch, { title: "Nouveau titre", authorEmail: null });
    assert.deepEqual(parseAnnonceEdit({}), { ok: true, patch: {} });
    assert.equal(parseAnnonceEdit({ title: "" }).ok, false);
    assert.equal(parseAnnonceEdit({ category: "Autre" }).ok, false);
    assert.equal(parseAnnonceEdit({ content: "   " }).ok, false);
    assert.equal(parseAnnonceEdit({ authorEmail: "x@y" }).ok, false);
    const e = parseAnnonceEdit({ category: "Entraide", content: "ok", authorName: "MAG" });
    assert.ok(e.ok);
    if (e.ok) assert.deepEqual(e.patch, { category: "Entraide", content: "ok", authorName: "MAG" });
  });
});

describe("annonces : photo", () => {
  test("type d'image par octets magiques", () => {
    assert.equal(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0])), "image/jpeg");
    assert.equal(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), "image/png");
    const webp = new Uint8Array([...("RIFF".split("").map((c) => c.charCodeAt(0))), 0, 0, 0, 0, ...("WEBP".split("").map((c) => c.charCodeAt(0))), 0]);
    assert.equal(detectImageType(webp), "image/webp");
    assert.equal(detectImageType(new Uint8Array([0x47, 0x49, 0x46, 0x38])), null); // GIF
    assert.equal(detectImageType(new Uint8Array([0x25, 0x50, 0x44, 0x46])), null); // PDF
    assert.equal(detectImageType(new Uint8Array([])), null);
  });
  test("chemin Blob daté, extension du type", () => {
    assert.equal(annoncePhotoPathname("image/jpeg", new Date("2026-10-10T08:00:00Z")), "annonces/2026-10-10-photo.jpg");
    assert.equal(annoncePhotoPathname("image/webp", new Date("2026-10-10T08:00:00Z")), "annonces/2026-10-10-photo.webp");
  });
});
