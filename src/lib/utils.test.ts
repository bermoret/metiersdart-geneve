import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { chipColors, contrastRatio, normalizeHex, readableOnTint } from "./utils";
import { categories } from "./data";

// Fond `hex + "20"` composé sur `ground` (blanc par défaut).
const tintOn = (hex: string, ground = "#ffffff") => {
  const a = 0x20 / 255;
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return (
    "#" +
    [1, 3, 5]
      .map((i) => Math.round(ch(hex, i) * a + ch(ground, i) * (1 - a)))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
};
// Survol de ligne : bg-mag-cream/20 sur blanc.
const ROW_HOVER = "#fdfaf7";

describe("contrastRatio", () => {
  test("noir sur blanc = 21:1", () => {
    assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
  });
  test("rouge MAG sur blanc ≈ 6.26:1", () => {
    assert.equal(contrastRatio("#b42c36", "#ffffff").toFixed(2), "6.26");
  });
});

describe("normalizeHex", () => {
  test("formes acceptées", () => {
    assert.equal(normalizeHex("#B42C36"), "#b42c36");
    assert.equal(normalizeHex("b42c36"), "#b42c36");
    assert.equal(normalizeHex("  #8b4513 "), "#8b4513");
    assert.equal(normalizeHex("#9d8"), "#99dd88");
  });
  test("formes refusées", () => {
    for (const bad of ["", "rouge", "#b42c36ff", "#12345", "red;background:url(x)", '"onclick=alert``//', null, undefined]) {
      assert.equal(normalizeHex(bad), null, String(bad));
    }
  });
});

describe("chipColors : puces domaine", () => {
  test("chaque couleur de domaine atteint 4.5:1, au repos et au survol de ligne", () => {
    for (const c of categories) {
      const { color } = chipColors(c.color);
      const hex = normalizeHex(c.color)!;
      assert.ok(contrastRatio(color, tintOn(hex)) >= 4.5, `${c.name} repos (${c.color} → ${color})`);
      assert.ok(contrastRatio(color, tintOn(hex, ROW_HOVER)) >= 4.5, `${c.name} survol (${c.color} → ${color})`);
    }
  });
  test("une couleur déjà lisible reste inchangée", () => {
    assert.equal(chipColors("#8b4513").color, "#8b4513");
    assert.equal(chipColors("#1a5276").color, "#1a5276");
  });
  test("une couleur trop claire est assombrie, pas remplacée par du noir", () => {
    const { color } = chipColors("#d4a574");
    assert.notEqual(color, "#d4a574");
    assert.notEqual(color, "#000000");
  });
  test("fond = couleur normalisée + alpha 20", () => {
    assert.equal(chipColors("B42C36").backgroundColor, "#b42c3620");
    assert.equal(chipColors("#9d8").backgroundColor, "#99dd8820");
  });
  test("valeur invalide ou absente → gris lisible, jamais la valeur brute", () => {
    for (const bad of ["red;x", "#b42c36ff", null, undefined]) {
      const s = chipColors(bad);
      assert.equal(s.backgroundColor, "#99999920");
      assert.equal(s.color, readableOnTint("#999999"));
    }
  });
});
