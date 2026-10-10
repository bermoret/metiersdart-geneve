import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { countBy, evolutionByYear, exitsByYearAndReason, yearRange, type DossierDates } from "./stats";

const rows: DossierDates[] = [
  { status: "actif", integratedAt: "2021-03-26", deactivatedAt: null, deactivationReason: null },
  { status: "actif", integratedAt: "2023-05-01", deactivatedAt: null, deactivationReason: null },
  { status: "desactive", integratedAt: "2021-03-26", deactivatedAt: "2023-09-19", deactivationReason: "faillite" },
  { status: "desactive", integratedAt: "2022-01-10", deactivatedAt: null, deactivationReason: "retraite" },
  { status: "actif", integratedAt: null, deactivatedAt: null, deactivationReason: null },
  { status: "eligible", integratedAt: null, deactivatedAt: null, deactivationReason: null },
  { status: "en_evaluation", integratedAt: null, deactivatedAt: null, deactivationReason: null },
];

describe("statistiques", () => {
  test("années couvertes", () => {
    assert.deepEqual(yearRange(rows, 2024), [2021, 2022, 2023, 2024]);
    assert.deepEqual(yearRange([{ status: "actif", integratedAt: "2019-01-01", deactivatedAt: null, deactivationReason: null }], 2021), [2019, 2020, 2021]);
  });
  test("évolution : intégrations, sorties, actifs au 31.12", () => {
    const ev = evolutionByYear(rows, [2021, 2022, 2023, 2024]);
    assert.deepEqual(ev, [
      { year: 2021, integrated: 2, exits: 0, active: 3 }, // 2 intégrés 2021 + 1 actif sans date
      { year: 2022, integrated: 1, exits: 0, active: 4 },
      { year: 2023, integrated: 1, exits: 1, active: 4 }, // +1 intégré, −1 faillite
      { year: 2024, integrated: 0, exits: 1, active: 3 }, // sortie sans date → année courante
    ]);
  });
  test("comptages et sorties", () => {
    assert.deepEqual(countBy([{ d: "Bois" }, { d: "Bois" }, { d: null }, { d: "Cuir" }], (r) => r.d), [
      { key: "Bois", count: 2 },
      { key: "(non renseigné)", count: 1 },
      { key: "Cuir", count: 1 },
    ]);
    assert.deepEqual(exitsByYearAndReason(rows), [
      { year: 2023, reason: "faillite", count: 1 },
      { year: null, reason: "retraite", count: 1 },
    ]);
  });
});
