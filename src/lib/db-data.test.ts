import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { artisans, artisansOnly, artisanCategories } from "./data";
import { artisanDetails, getArtisanDetail } from "./artisan-details";
import {
  getPublishedArtisans,
  getArtisansOnly,
  getArtisanCategories,
  getArtisansByCategoryDb,
  getArtisanBySlugDb,
  getJemaEditions,
  splitJemaEditions,
  countCommunes,
  type PublicJemaEdition,
} from "./db-data";
import { formatShortRange } from "./dates";
import { compareFr } from "./utils";

// Sans base : db-data sert le fallback statique, sans aucune requête SQL.
// Ces tests couvrent donc les règles LOT 1 telles que calculées par la
// couche utilisée en production (et non leur copie dans data.ts).
delete process.env.DATABASE_URL;

const NON_ARTISAN_TYPES = [
  "institution_culturelle",
  "ecole_formatrice",
  "association_professionnelle",
  "partenaire",
];

// ─── Règles LOT 1 via db-data ──────────────────────────────────

describe("db-data : comptages et filtres (fallback statique)", () => {
  test("getPublishedArtisans renvoie les 145 entités", async () => {
    assert.equal((await getPublishedArtisans()).length, 145);
  });

  test("listes publiques dans l'ordre alphabétique français (« mademoiselle L » parmi les M)", async () => {
    const sorted = (names: string[]) =>
      names.every((n, i) => i === 0 || compareFr(names[i - 1], n) <= 0);
    const all = (await getPublishedArtisans()).map((a) => a.name);
    assert.ok(sorted(all));
    const i = all.findIndex((n) => n.startsWith("mademoiselle L"));
    // Première des M (« mad… » < « Maï… »), et non plus en queue de liste après le Z
    assert.ok(i > 0 && all[i - 1].startsWith("L") && all[i + 1].startsWith("M"));
    for (const cat of artisanCategories) {
      assert.ok(sorted((await getArtisansByCategoryDb(cat.slug)).map((a) => a.name)), cat.slug);
    }
  });

  test("chaque fiche a un texte de présentation (« À propos »)", async () => {
    const empty = (await getPublishedArtisans()).filter((a) => !a.longDescription?.trim());
    assert.deepEqual(empty.map((a) => a.name), []);
  });

  test("getArtisansOnly : 114 artisans, aucun type non-artisan", async () => {
    const list = await getArtisansOnly();
    assert.equal(list.length, 114);
    assert.ok(list.every((a) => !NON_ARTISAN_TYPES.includes(a.type)));
  });

  test("getArtisanCategories : les 12 domaines de data.ts", async () => {
    const slugs = (await getArtisanCategories()).map((c) => c.slug).sort();
    assert.equal(slugs.length, 12);
    assert.deepEqual(slugs, artisanCategories.map((c) => c.slug).sort());
  });

  test("getArtisansByCategoryDb : catégorie institutionnelle → vide", async () => {
    assert.deepEqual(await getArtisansByCategoryDb("institutions-culturelles"), []);
    assert.deepEqual(await getArtisansByCategoryDb("ecoles-formatrices"), []);
  });

  test("getArtisansByCategoryDb : chaque domaine = ses artisans, sans non-artisans", async () => {
    for (const cat of artisanCategories) {
      const list = await getArtisansByCategoryDb(cat.slug);
      const expected = artisansOnly.filter((a) => a.categoryName === cat.name);
      assert.equal(list.length, expected.length, cat.slug);
      assert.ok(list.length > 0, `${cat.slug} doit avoir au moins un artisan`);
      assert.ok(list.every((a) => !NON_ARTISAN_TYPES.includes(a.type)), cat.slug);
    }
  });

  test("getArtisanBySlugDb : slug connu → fiche enrichie ; inconnu → null", async () => {
    const known = artisans.find((a) => a.name === "Sellerie Kühnen, Fabienne Panelati");
    assert.ok(known);
    const found = await getArtisanBySlugDb(known.slug);
    assert.equal(found?.name, known.name);
    assert.ok(found?.poinconType, "le poinçon doit être résolu depuis artisan-details");
    assert.equal(await getArtisanBySlugDb("slug-qui-n-existe-pas"), null);
  });

  test("countCommunes : communes distinctes de la liste reçue", async () => {
    const all = await getPublishedArtisans();
    assert.equal(countCommunes(all), new Set(artisans.map((a) => a.commune)).size);
  });

  test("getJemaEditions : pas d'éditions sans base", async () => {
    assert.deepEqual(await getJemaEditions(), []);
  });
});

// ─── Résolution tolérante des détails scrapés ──────────────────

describe("getArtisanDetail", () => {
  test("correspondance exacte", () => {
    const key = Object.keys(artisanDetails)[0];
    assert.equal(getArtisanDetail(key), artisanDetails[key]);
  });

  test("clé tronquée : tous les mots de la clé présents dans le nom", () => {
    assert.equal(
      getArtisanDetail("Sellerie Kühnen, Fabienne Panelati"),
      artisanDetails["Sellerie Kühnen"],
    );
  });

  test("abréviation en fin de nom", () => {
    assert.equal(
      getArtisanDetail("Association Romande des Métiers de la Bijouterie — ASMEBI"),
      artisanDetails["ASMEBI"],
    );
  });

  test("nom inconnu → undefined", () => {
    assert.equal(getArtisanDetail("Atelier totalement inventé"), undefined);
  });

  test("au moins 144 des 145 entités retrouvent leurs détails", () => {
    const resolved = artisans.filter((a) => getArtisanDetail(a.name)).length;
    assert.ok(resolved >= 144, `${resolved}/145 seulement`);
  });

  test("aucune clé de détails n'est attribuée à deux entités", () => {
    const owners = new Map<unknown, string>();
    for (const a of artisans) {
      const d = getArtisanDetail(a.name);
      if (!d) continue;
      assert.ok(!owners.has(d), `${a.name} et ${owners.get(d)} partagent la même fiche`);
      owners.set(d, a.name);
    }
  });
});

// ─── Éditions JEMA ─────────────────────────────────────────────

function edition(year: number, isUpcoming: boolean, isPast: boolean): PublicJemaEdition {
  return {
    id: String(year),
    year,
    title: `JEMA ${year}`,
    startDate: null,
    endDate: null,
    isUpcoming,
    isPast,
    description: null,
    highlight: null,
    programUrl: null,
    stats: null,
  };
}

describe("splitJemaEditions", () => {
  test("prochaine édition = l'année à venir la plus proche", () => {
    const { upcoming } = splitJemaEditions([
      edition(2028, true, false),
      edition(2027, true, false),
      edition(2026, false, true),
    ]);
    assert.equal(upcoming?.year, 2027);
  });

  test("passées = marquées passées, hors à venir et brouillons, plus récente d'abord", () => {
    const { past } = splitJemaEditions([
      edition(2024, false, true),
      edition(2029, false, false), // brouillon
      edition(2027, true, true), // incohérente : « à venir » prime
      edition(2026, false, true),
    ]);
    assert.deepEqual(past.map((e) => e.year), [2026, 2024]);
  });

  test("aucune édition à venir → null", () => {
    assert.equal(splitJemaEditions([edition(2026, false, true)]).upcoming, null);
  });
});

describe("formatShortRange", () => {
  test("même mois", () => {
    assert.equal(formatShortRange(new Date(2026, 2, 27), new Date(2026, 2, 29)), "27-29 mars 2026");
  });

  test("à cheval sur deux mois", () => {
    assert.equal(
      formatShortRange(new Date(2029, 2, 30), new Date(2029, 3, 1)),
      "30 mars - 1 avril 2029",
    );
  });

  test("à cheval sur deux années", () => {
    assert.equal(
      formatShortRange(new Date(2029, 11, 30), new Date(2030, 0, 2)),
      "30 décembre 2029 - 2 janvier 2030",
    );
  });

  test("édition d'un seul jour", () => {
    assert.equal(formatShortRange(new Date(2027, 2, 19), new Date(2027, 2, 19)), "19 mars 2027");
  });

  test("sans date de fin / sans date", () => {
    assert.equal(formatShortRange(new Date(2027, 2, 19), null), "19 mars 2027");
    assert.equal(formatShortRange(null, null), "");
  });
});
