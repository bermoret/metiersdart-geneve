import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  test("échappe & < > \" '", () => {
    assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
  });

  test("& échappé une seule fois (pas de double échappement des entités produites)", () => {
    assert.equal(escapeHtml("<a>"), "&lt;a&gt;");
    assert.equal(escapeHtml("&amp;"), "&amp;amp;");
  });

  test("charge XSS neutralisée en contenu et en attribut", () => {
    assert.equal(
      escapeHtml(`<img src=x onerror="alert(1)">`),
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    assert.equal(escapeHtml(`' onclick='alert(1)`), "&#39; onclick=&#39;alert(1)");
  });

  test("texte ordinaire inchangé (accents, apostrophe typographique)", () => {
    assert.equal(escapeHtml("Vandœuvres — l’atelier"), "Vandœuvres — l’atelier");
    assert.equal(escapeHtml(""), "");
  });
});
