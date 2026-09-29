import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { isExternalHref, isHttpUrl, isPublicHref } from "./url";

describe("isPublicHref", () => {
  test("http(s), mailto et chemin du site acceptés", () => {
    for (const ok of [
      "https://www.prix-artisanat-geneve.ch/prix-de-lartisanat-concours-2027",
      "http://example.ch",
      "mailto:contact@metiersdart-geneve.ch",
      "MAILTO:Contact@Example.ch",
      "/jema",
      "/",
      "/jema/2027?x=1#programme",
    ]) {
      assert.equal(isPublicHref(ok), true, ok);
    }
  });

  test("autres schémas, chemins relatifs et protocoles relatifs refusés", () => {
    for (const bad of [
      "javascript:alert(1)",
      "data:text/html,<b>x</b>",
      "//evil.ch/x",
      "/\\evil.ch",
      "jema",
      "www.example.ch",
      "mailto:pas une adresse",
      "mailto:a@b",
      "mailto:a@b.ch?subject=x",
      "/jema 2027",
      "",
      null,
      undefined,
    ]) {
      assert.equal(isPublicHref(bad), false, String(bad));
    }
  });
});

describe("isExternalHref", () => {
  test("http(s) → nouvel onglet ; mailto et chemins → même onglet", () => {
    assert.equal(isExternalHref("https://example.ch"), true);
    assert.equal(isExternalHref("HTTP://example.ch"), true);
    assert.equal(isExternalHref("mailto:a@b.ch"), false);
    assert.equal(isExternalHref("/jema"), false);
  });
});

describe("isHttpUrl", () => {
  test("adresses http(s) acceptées", () => {
    assert.equal(isHttpUrl("https://issuu.com/mag/docs/programme"), true);
    assert.equal(isHttpUrl("http://example.ch"), true);
    assert.equal(isHttpUrl("HTTPS://EXAMPLE.CH/a?b=c#d"), true);
  });

  test("autres schémas et chemins refusés", () => {
    for (const bad of [
      "javascript:alert(1)",
      "JavaScript://%0aalert(1)",
      "data:text/html,<b>x</b>",
      "mailto:info@example.ch",
      "//example.ch",
      "/jema/2026",
      "www.example.ch",
      " https://example.ch",
      "ftp://example.ch",
    ]) {
      assert.equal(isHttpUrl(bad), false, bad);
    }
  });

  test("adresse mal formée ou valeur non textuelle refusée", () => {
    assert.equal(isHttpUrl("https://"), false);
    assert.equal(isHttpUrl("https://exa mple.ch"), false);
    assert.equal(isHttpUrl(""), false);
    assert.equal(isHttpUrl(null), false);
    assert.equal(isHttpUrl(undefined), false);
    assert.equal(isHttpUrl(42), false);
  });
});
