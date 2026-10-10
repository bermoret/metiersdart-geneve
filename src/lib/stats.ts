// Statistiques des artisans (LOT A2) : calculs purs sur les dossiers
// (date d'intégration, date de sortie, motif), testés dans stats.test.ts.
// Les requêtes sont dans src/lib/stats-db.ts (serveur, admin).

export type CommuneView = {
  commune: string;
  artisans: { name: string; craft: string | null; categoryName: string | null; slug: string; status: string | null; integratedAt: string | null }[];
  ecoles: { name: string; slug: string }[];
  institutions: { name: string; slug: string }[];
  associations: { name: string; slug: string }[];
  partenaires: { name: string; slug: string }[];
};

export type DossierDates = {
  status: "en_evaluation" | "eligible" | "actif" | "desactive";
  integratedAt: string | null;
  deactivatedAt: string | null;
  deactivationReason: string | null;
};

const year = (iso: string | null | undefined): number | null => (iso && /^\d{4}/.test(iso) ? Number(iso.slice(0, 4)) : null);

/** Années couvertes : de la première intégration (ou `from`) à `to` inclus. */
export function yearRange(rows: readonly DossierDates[], to: number, from = 2021): number[] {
  const first = Math.min(from, ...rows.map((r) => year(r.integratedAt) ?? from));
  const out: number[] = [];
  for (let y = first; y <= to; y++) out.push(y);
  return out;
}

export type YearPoint = { year: number; integrated: number; exits: number; active: number };

/**
 * Évolution par année : intégrations, sorties et effectif actif au 31 décembre
 * (intégré·e·s jusqu'à cette année, moins sorti·e·s jusqu'à cette année). Un
 * dossier actif sans date d'intégration est compté actif pour toutes les années ;
 * une sortie sans date compte dans l'année en cours.
 */
export function evolutionByYear(rows: readonly DossierDates[], years: readonly number[]): YearPoint[] {
  const current = years[years.length - 1];
  return years.map((y) => {
    let integrated = 0;
    let exits = 0;
    let active = 0;
    for (const r of rows) {
      if (r.status === "en_evaluation" || r.status === "eligible") continue;
      const yi = year(r.integratedAt);
      const yd = r.status === "desactive" ? (year(r.deactivatedAt) ?? current) : null;
      if (yi === y) integrated++;
      if (yd === y) exits++;
      const inBy = yi === null || yi <= y;
      const outBy = yd !== null && yd <= y;
      if (inBy && !outBy) active++;
    }
    return { year: y, integrated, exits, active };
  });
}

/** Comptage par clé, trié par effectif décroissant puis clé. */
export function countBy<T>(rows: readonly T[], key: (r: T) => string | null | undefined, label = "(non renseigné)"): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = key(r)?.trim() || label;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([k, count]) => ({ key: k, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, "fr"));
}

/** Sorties par année et par motif. */
export function exitsByYearAndReason(rows: readonly DossierDates[]): { year: number | null; reason: string; count: number }[] {
  const map = new Map<string, { year: number | null; reason: string; count: number }>();
  for (const r of rows) {
    if (r.status !== "desactive") continue;
    const y = year(r.deactivatedAt);
    const reason = r.deactivationReason ?? "autre";
    const k = `${y}|${reason}`;
    const cur = map.get(k) ?? { year: y, reason, count: 0 };
    cur.count++;
    map.set(k, cur);
  }
  return [...map.values()].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.reason.localeCompare(b.reason));
}
