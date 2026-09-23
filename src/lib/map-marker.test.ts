import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { artisanMarker, spreadOverlapping } from "./map-marker";

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

describe("spreadOverlapping : pastilles au même point réparties en cercle", () => {
  const at = (id: string, latitude: number, longitude: number) => ({ id, latitude, longitude });
  test("un point isolé ne bouge pas", () => {
    const [p] = spreadOverlapping([at("a", 46.2, 6.14)]);
    assert.deepEqual([p.lat, p.lng], [46.2, 6.14]);
  });
  test("points confondus → positions distinctes, à moins de 200 m du point d'origine", () => {
    const pts = spreadOverlapping(Array.from({ length: 26 }, (_, i) => at(String(i), 46.2044, 6.1432)));
    assert.equal(new Set(pts.map((p) => `${p.lat},${p.lng}`)).size, 26);
    for (const p of pts) {
      const dy = (p.lat - 46.2044) * 111_320;
      const dx = (p.lng - 6.1432) * 111_320 * Math.cos((46.2044 * Math.PI) / 180);
      assert.ok(Math.hypot(dx, dy) < 200);
    }
  });
});
