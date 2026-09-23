import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  chipColors,
  communeKey,
  compareFr,
  contrastRatio,
  isHexColor,
  normalizeHex,
  readableOnTint,
  sortByName,
} from "./utils";
import { categories, communesList } from "./data";
import geCommunes from "./ge-communes.json";

describe("communeKey", () => {
  test("article, suffixe cantonal, ligature et accents neutralisés", () => {
    assert.equal(communeKey("Le Grand-Saconnex"), communeKey("Grand-Saconnex"));
    assert.equal(communeKey("Carouge (GE)"), "carouge");
    assert.equal(communeKey("Carouge (ge)"), "carouge");
    assert.equal(communeKey("Vandœuvres"), communeKey("Vandoeuvres"));
    assert.equal(communeKey("Chêne-Bougeries"), "chene-bougeries");
  });
  test("nom d'usage ramené à la commune officielle", () => {
    assert.equal(communeKey("Perly"), communeKey("Perly-Certoux"));
  });
  test("un « La » qui fait partie du nom est conservé", () => {
    assert.equal(communeKey("Lancy"), "lancy");
    assert.equal(communeKey("Laconnex"), "laconnex");
  });
  test("les 45 territoires et les 45 communes de la liste se répondent un à un", () => {
    const geoKeys = geCommunes.features.map((f) => communeKey(f.properties.name));
    const listKeys = communesList.map((c) => communeKey(c.name));
    assert.equal(geoKeys.length, 45);
    assert.equal(new Set(geoKeys).size, geoKeys.length);
    assert.deepEqual([...listKeys].sort(), [...geoKeys].sort());
  });
});

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

describe("isHexColor : couleur de catégorie acceptée par l'API admin", () => {
  test("#rrggbb, casse indifférente", () => {
    for (const ok of ["#b42c36", "#B42C36", "#000000", "#FfFfFf"]) {
      assert.equal(isHexColor(ok), true, ok);
    }
  });
  test("tout le reste est refusé, y compris les formes que normalizeHex tolère", () => {
    const bad: unknown[] = [
      "", "b42c36", "#9d8", " #b42c36", "#b42c36 ", "#b42c36\n", "#b42c36ff", "#b42c3g",
      "red", "#b42c36;x", '"onclick=alert``//', null, undefined, 0xb42c36, ["#b42c36"], {},
    ];
    for (const v of bad) assert.equal(isHexColor(v), false, JSON.stringify(v));
  });
  test("les couleurs du seed passent", () => {
    for (const c of categories) assert.ok(isHexColor(c.color), `${c.name} (${c.color})`);
  });
  test("toute sortie de normalizeHex passe (le formulaire admin envoie la forme normalisée)", () => {
    for (const raw of ["#9d8", "B42C36", "  #8b4513 "]) assert.ok(isHexColor(normalizeHex(raw)), raw);
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

describe("compareFr / sortByName : ordre alphabétique français", () => {
  test("casse et accents ignorés (la base, en collation C, les rangeait après le Z)", () => {
    const names = ["Yvan Hostettler", "mademoiselle L — Laurence Imstepf", "Maïa Kvasnikova", "Béatrice Archinard", "Bracelets Protexo SA", "Marco Olivet"];
    assert.deepEqual(
      sortByName(names.map((name) => ({ name }))).map((a) => a.name),
      ["Béatrice Archinard", "Bracelets Protexo SA", "mademoiselle L — Laurence Imstepf", "Maïa Kvasnikova", "Marco Olivet", "Yvan Hostettler"],
    );
  });
  test("ex æquo à la casse près → 0 (le tri stable garde l'ordre reçu)", () => {
    assert.equal(compareFr("atelier", "Atelier"), 0);
    assert.equal(compareFr("Ebénisterie", "Ébénisterie"), 0);
  });
  test("sortByName ne modifie pas la liste reçue", () => {
    const list = [{ name: "b" }, { name: "a" }];
    sortByName(list);
    assert.deepEqual(list, [{ name: "b" }, { name: "a" }]);
  });
});
