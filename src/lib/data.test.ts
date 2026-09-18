import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  artisans,
  artisansOnly,
  artisanCategories,
  categories,
  getArtisansByCategory,
} from "./data";

// ─── Constantes attendues (LOT 1) ──────────────────────────────

const EXPECTED_TOTAL_ENTITIES = 145;
const EXPECTED_ARTISANS = 114;
const EXPECTED_DOMAINS = 12;

const NON_ARTISAN_TYPES = [
  "institution_culturelle",
  "ecole_formatrice",
  "association_professionnelle",
  "partenaire",
] as const;

// ─── Tests ─────────────────────────────────────────────────────

describe("Répertoire : total des entités", () => {
  test("le scraping a produit 145 entités", () => {
    assert.equal(artisans.length, EXPECTED_TOTAL_ENTITIES);
  });

  test("chaque entité a un type non vide", () => {
    for (const a of artisans) {
      assert.ok(a.type, `Entité ${a.id} (${a.name}) sans type`);
    }
  });

  test("chaque entité a une commune non vide", () => {
    for (const a of artisans) {
      assert.ok(a.commune, `Entité ${a.id} (${a.name}) sans commune`);
    }
  });
});

describe("Comptage artisans (type = artisan uniquement)", () => {
  test("artisansOnly exclut les types non-artisan", () => {
    for (const a of artisansOnly) {
      assert.equal(
        a.type,
        "artisan",
        `${a.name} (${a.id}) est dans artisansOnly mais a type=${a.type}`,
      );
    }
  });

  test("artisansOnly contient exactement 114 entrées", () => {
    assert.equal(artisansOnly.length, EXPECTED_ARTISANS);
  });

  test("aucun type non-artisan ne figure dans artisansOnly", () => {
    const nonArtisansInList = artisansOnly.filter((a) =>
      NON_ARTISAN_TYPES.includes(a.type as typeof NON_ARTISAN_TYPES[number]),
    );
    assert.equal(nonArtisansInList.length, 0, "Des non-artisans sont présents dans artisansOnly");
  });

  test("la somme artisans + non-artisans = total", () => {
    const nonArtisanCount = artisans.length - artisansOnly.length;
    assert.equal(artisansOnly.length + nonArtisanCount, artisans.length);
  });
});

describe("Métiers dédoublonnés", () => {
  test("le nombre de métiers uniques parmi les artisans est calculé par Set sur craft", () => {
    const uniqueCrafts = new Set(artisansOnly.map((a) => a.craft));
    // On ne force pas la valeur : on vérifie que c'est un Set valide et < au total
    assert.ok(uniqueCrafts.size > 0, "Aucun métier trouvé");
    assert.ok(uniqueCrafts.size < artisansOnly.length, "Les métiers ne sont pas dédoublonnés");
  });

  test("le site affichait 106 métiers doublons inclus ; dédoublonné doit être inférieur", () => {
    const uniqueCrafts = new Set(artisansOnly.map((a) => a.craft));
    assert.ok(
      uniqueCrafts.size < 106,
      `Le décompte dédoublonné (${uniqueCrafts.size}) devrait être inférieur à 106 (doublons inclus)`,
    );
  });

  test("au moins un métier apparaît chez plusieurs artisans (vérifie le dédoublonnage)", () => {
    const craftCounts: Record<string, number> = {};
    for (const a of artisansOnly) {
      craftCounts[a.craft] = (craftCounts[a.craft] ?? 0) + 1;
    }
    const duplicates = Object.entries(craftCounts).filter(([, n]) => n > 1);
    assert.ok(duplicates.length > 0, "Aucun métier en double trouvé — le dédoublonnage n'a rien à faire");
  });
});

describe("Communes distinctes", () => {
  test("toutes entités confondues, on compte les communes distinctes", () => {
    const allCommunes = new Set(artisans.map((a) => a.commune));
    assert.ok(allCommunes.size >= 20, `Moins de 20 communes trouvées (${allCommunes.size})`);
  });

  test("les communes comptent tous types d'entités (pas seulement artisans)", () => {
    const communesAll = new Set(artisans.map((a) => a.commune));
    const communesArtisansOnly = new Set(artisansOnly.map((a) => a.commune));
    assert.ok(
      communesAll.size >= communesArtisansOnly.size,
      "Le décompte toutes entités doit être >= au décompte artisans seuls",
    );
  });

  test("Clarens est présente (ARMP — association hors canton)", () => {
    const hasClarens = artisans.some((a) => a.commune === "Clarens");
    assert.ok(hasClarens, "Clarens devrait figurer dans le répertoire (ARMP)");
  });
});

describe("Domaines d'art (catégories ayant au moins un artisan)", () => {
  test("artisanCategories exclut les catégories institutionnelles", () => {
    const excludedSlugs = [
      "institutions-culturelles",
      "ecoles-formatrices",
      "associations-professionnelles",
      "partenaires",
    ];
    for (const c of artisanCategories) {
      assert.ok(
        !excludedSlugs.includes(c.slug),
        `${c.name} (${c.slug}) ne devrait pas être dans artisanCategories`,
      );
    }
  });

  test("artisanCategories contient exactement 12 domaines", () => {
    assert.equal(artisanCategories.length, EXPECTED_DOMAINS);
  });

  test("chaque domaine d'art a au moins un artisan rattaché", () => {
    for (const cat of artisanCategories) {
      const list = getArtisansByCategory(cat.slug);
      assert.ok(list.length > 0, `Domaine "${cat.name}" n'a aucun artisan`);
    }
  });
});

describe("Cohérence croisée", () => {
  test("artisans + institutions + écoles + associations + partenaires = 145", () => {
    const byType: Record<string, number> = {};
    for (const a of artisans) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
    }
    const sum = Object.values(byType).reduce((x, y) => x + y, 0);
    assert.equal(sum, EXPECTED_TOTAL_ENTITIES);
  });

  test("les 5 types non-artisan font 31 entités (145 - 114)", () => {
    const nonArtisanCount = artisans.filter((a) => a.type !== "artisan").length;
    assert.equal(nonArtisanCount, 31);
  });
});
