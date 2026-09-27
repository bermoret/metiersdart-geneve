import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { isHttpUrl } from "./url";

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
