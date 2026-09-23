import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { artisanMarker } from "./map-marker";

describe("artisanMarker : pastille de la carte d'accueil (HTML injecté par Leaflet)", () => {
  test("couleur valide → normalisée dans le style", () => {
    const m = artisanMarker("#8B4513");
    assert.equal(m.key, "#8b4513");
    assert.match(m.html, /background:#8b4513;/);
    assert.deepEqual([m.size, m.anchor], [16, 8]);
  });
  test("absente → pastille par défaut, rouge MAG", () => {
    for (const raw of [null, undefined, ""]) {
      const m = artisanMarker(raw);
      assert.equal(m.key, "_default");
      assert.match(m.html, /background:#b42c36;/);
      assert.deepEqual([m.size, m.anchor], [18, 9]);
    }
  });
  test("charge XSS / CSS → jamais recopiée, repli par défaut", () => {
    for (const raw of ['"onclick=alert``//', '"><img src=x onerror=alert(1)>', "red;background:url(//x)", "#b42c36\" onmouseover=x"]) {
      const m = artisanMarker(raw);
      assert.equal(m.key, "_default", raw);
      assert.equal(m.html, artisanMarker(null).html, raw);
    }
  });
  test("le HTML ne contient qu'un seul attribut style, sans guillemet parasite", () => {
    const { html } = artisanMarker('"onclick=alert``//');
    assert.equal(html.split('"').length - 1, 4); // class="…" style="…"
    assert.doesNotMatch(html, /onclick|onerror|onmouseover/i);
  });
});
