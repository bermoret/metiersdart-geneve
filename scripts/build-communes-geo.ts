/**
 * Génère src/lib/ge-communes.json : le territoire des 45 communes genevoises,
 * pour la carte « Communes qui soutiennent MAG » (/qui-sommes-nous).
 *
 * Source : swisstopo, swissBOUNDARIES3D (limites communales, données ouvertes),
 * via l'API publique api3.geo.admin.ch, en WGS84.
 *
 * La géométrie brute (~20 000 sommets) est simplifiée (Douglas-Peucker) en
 * préservant la topologie : chaque frontière partagée entre deux communes est
 * simplifiée une seule fois et réutilisée des deux côtés, pour qu'il n'y ait
 * ni trou ni chevauchement entre communes voisines.
 *
 * Millésime 2015 par défaut : c'est le dernier où les communes sont découpées
 * sans le lac (« politische_gemeinde » + « kantonaler_seeanteil » à part). Dès
 * 2016, le territoire communal inclut la part de Léman de chaque commune
 * riveraine (Genève couvrirait la Rade, Versoix le milieu du Petit-Lac).
 * Les limites terrestres n'ont que peu bougé depuis (Vandœuvres : 439 → 442 ha)
 * et le canton compte toujours 45 communes.
 *
 * Usage : npx tsx scripts/build-communes-geo.ts [année] [tolérance en mètres]
 *   (défaut : 2015, 10 m)
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

type Pt = [number, number];
type Feature = {
  properties: {
    gemname: string;
    gde_nr: number;
    kanton: string;
    jahr: number;
    objektart_lookup: string;
  };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
};

const YEAR = Number(process.argv[2] ?? 2015);
const TOLERANCE_M = Number(process.argv[3] ?? 10);
const EXPECTED_COMMUNES = 45;
const OUT = join(__dirname, "..", "src", "lib", "ge-communes.json");

const API =
  "https://api3.geo.admin.ch/rest/services/api/MapServer/identify" +
  "?geometryType=esriGeometryEnvelope&geometry=5.95,46.12,6.32,46.37&sr=4326" +
  "&layers=all:ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill" +
  "&tolerance=0&returnGeometry=true&geometryFormat=geojson&limit=200" +
  `&timeInstant=${YEAR}`;

// Distances en mètres : 1° de latitude ≈ 111 320 m ; la longitude est
// contractée par cos(latitude) — constante à l'échelle du canton.
const M_PER_DEG_LAT = 111_320;
const M_PER_DEG_LON = M_PER_DEG_LAT * Math.cos((46.2 * Math.PI) / 180);

const key = (p: Pt) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;

/** Distance (m) du point p au segment [a, b]. */
function segDist(p: Pt, a: Pt, b: Pt): number {
  const [px, py] = [p[0] * M_PER_DEG_LON, p[1] * M_PER_DEG_LAT];
  const [ax, ay] = [a[0] * M_PER_DEG_LON, a[1] * M_PER_DEG_LAT];
  const [bx, by] = [b[0] * M_PER_DEG_LON, b[1] * M_PER_DEG_LAT];
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Douglas-Peucker ; les extrémités sont toujours conservées. */
function simplify(pts: Pt[], tol: number): Pt[] {
  if (pts.length <= 2) return pts;
  const keep = new Array<boolean>(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop()!;
    let max = -1;
    let idx = -1;
    for (let k = i + 1; k < j; k++) {
      const d = segDist(pts[k], pts[i], pts[j]);
      if (d > max) [max, idx] = [d, k];
    }
    if (max > tol) {
      keep[idx] = true;
      stack.push([i, idx], [idx, j]);
    }
  }
  return pts.filter((_, k) => keep[k]);
}

async function main() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`swisstopo : HTTP ${res.status}`);
  const { results } = (await res.json()) as { results: Feature[] };
  const features = results
    .filter(
      (f) =>
        f.properties.kanton === "GE" &&
        f.properties.jahr === YEAR &&
        f.properties.objektart_lookup !== "kantonaler_seeanteil",
    )
    .sort((a, b) => a.properties.gde_nr - b.properties.gde_nr);
  if (features.length !== EXPECTED_COMMUNES) {
    throw new Error(`${features.length} communes GE pour ${YEAR}, ${EXPECTED_COMMUNES} attendues`);
  }

  // Anneaux (sans point de fermeture), indexés globalement.
  const polys: Pt[][][][] = features.map((f) =>
    f.geometry.type === "Polygon"
      ? [f.geometry.coordinates as Pt[][]]
      : (f.geometry.coordinates as Pt[][][]),
  );
  const rings: Pt[][] = [];
  for (const fp of polys) for (const p of fp) for (const r of p) rings.push(r.slice(0, -1));

  // Pour chaque sommet : l'ensemble des anneaux qui le contiennent.
  const owners = new Map<string, Set<number>>();
  rings.forEach((r, ri) =>
    r.forEach((p) => {
      const k = key(p);
      if (!owners.has(k)) owners.set(k, new Set());
      owners.get(k)!.add(ri);
    }),
  );
  const sig = (p: Pt) => [...owners.get(key(p))!].sort((a, b) => a - b).join(",");

  // Arcs simplifiés, mis en cache sous une forme canonique : une frontière
  // partagée donne exactement les mêmes sommets dans les deux communes.
  const arcCache = new Map<string, Pt[]>();
  const simplifyArc = (arc: Pt[]): Pt[] => {
    const fwd = key(arc[0]) + "|" + key(arc[1]) + "|" + key(arc[arc.length - 1]);
    const rev = [...arc].reverse();
    const bwd = key(rev[0]) + "|" + key(rev[1]) + "|" + key(rev[rev.length - 1]);
    const canonicalIsFwd = fwd <= bwd;
    const cacheKey = canonicalIsFwd ? fwd : bwd;
    if (!arcCache.has(cacheKey)) {
      arcCache.set(cacheKey, simplify(canonicalIsFwd ? arc : rev, TOLERANCE_M));
    }
    const s = arcCache.get(cacheKey)!;
    return canonicalIsFwd ? s : [...s].reverse();
  };

  const simplifyRing = (r: Pt[]): Pt[] => {
    const n = r.length;
    const sigs = r.map(sig);
    // Sommet fixe = extrémité d'une frontière (changement de voisinage).
    let fixed = r
      .map((_, i) => i)
      .filter((i) => sigs[i] !== sigs[(i - 1 + n) % n] || sigs[i] !== sigs[(i + 1) % n]);
    if (fixed.length < 2) {
      // Anneau sans changement de voisinage (îlot, ou trou rempli par une
      // enclave) : départ sur la plus petite clé, pour que les deux anneaux
      // d'une même frontière la découpent pareil, puis le sommet le plus éloigné.
      const keys = r.map(key);
      const start = keys.indexOf([...keys].sort()[0]);
      let far = start;
      let max = -1;
      r.forEach((p, i) => {
        const d = segDist(p, r[start], r[start]);
        if (d > max) [max, far] = [d, i];
      });
      fixed = far === start ? [start] : [start, far];
    }
    const out: Pt[] = [];
    for (let f = 0; f < fixed.length; f++) {
      const from = fixed[f];
      const to = fixed[(f + 1) % fixed.length];
      const arc: Pt[] = [];
      for (let i = from; ; i = (i + 1) % n) {
        arc.push(r[i]);
        if (i === to && arc.length > 1) break;
      }
      out.push(...simplifyArc(arc).slice(0, -1));
    }
    // Arrondi à 1e-5° (~1 m) : les sommets partagés restent identiques.
    const round = (pts: Pt[]) =>
      pts
        .map((p): Pt => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5])
        .filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
    let rounded = round(out);
    if (rounded.length < 3) rounded = round(r); // trop simplifié : on garde l'original
    return [...rounded, rounded[0]];
  };

  let vIn = 0;
  let vOut = 0;
  const out = {
    type: "FeatureCollection",
    source: `swisstopo, swissBOUNDARIES3D ${YEAR}, simplifié à ${TOLERANCE_M} m`,
    features: features.map((f, fi) => {
      const coords = polys[fi].map((p) =>
        p.map((r) => {
          vIn += r.length;
          const s = simplifyRing(r.slice(0, -1));
          vOut += s.length;
          return s;
        }),
      );
      return {
        type: "Feature",
        properties: {
          // « Carouge (GE) » → « Carouge » ; le suffixe cantonal n'est qu'un désambiguïsant OFS.
          name: f.properties.gemname.replace(/\s*\([A-Z]{2}\)$/, ""),
          bfs: f.properties.gde_nr,
        },
        geometry:
          coords.length === 1
            ? { type: "Polygon", coordinates: coords[0] }
            : { type: "MultiPolygon", coordinates: coords },
      };
    }),
  };

  checkTopology(out.features.map((f) => f.geometry));

  const json = JSON.stringify(out);
  writeFileSync(OUT, json + "\n");
  console.log(
    `${out.features.length} communes, ${vIn} → ${vOut} sommets, ${(json.length / 1024).toFixed(0)} Ko → ${OUT}`,
  );
}

/**
 * Garde-fou avant écriture : toute arête dont les deux extrémités sont
 * partagées par un même voisin doit exister en sens inverse chez ce voisin
 * (sinon la simplification a ouvert un trou ou un chevauchement), et chaque
 * anneau doit rester un polygone fermé.
 */
function checkTopology(geoms: { type: string; coordinates: Pt[][] | Pt[][][] }[]) {
  const rings: Pt[][] = [];
  for (const g of geoms) {
    const polysOf = g.type === "Polygon" ? [g.coordinates as Pt[][]] : (g.coordinates as Pt[][][]);
    for (const p of polysOf) rings.push(...p);
  }
  const k = (p: Pt) => `${p[0]},${p[1]}`;
  const owners = new Map<string, Set<number>>();
  const edges = new Set<string>();
  rings.forEach((r, ri) => {
    if (r.length < 4 || k(r[0]) !== k(r[r.length - 1])) {
      throw new Error(`anneau ${ri} dégénéré ou non fermé`);
    }
    r.slice(0, -1).forEach((p) => {
      if (!owners.has(k(p))) owners.set(k(p), new Set());
      owners.get(k(p))!.add(ri);
    });
    for (let i = 0; i < r.length - 1; i++) edges.add(`${k(r[i])}>${k(r[i + 1])}`);
  });
  let orphans = 0;
  rings.forEach((r, ri) => {
    for (let i = 0; i < r.length - 1; i++) {
      const [a, b] = [k(r[i]), k(r[i + 1])];
      const shared = [...owners.get(a)!].some((o) => o !== ri && owners.get(b)!.has(o));
      if (shared && !edges.has(`${b}>${a}`)) orphans++;
    }
  });
  if (orphans > 0) throw new Error(`${orphans} arête(s) partagée(s) sans vis-à-vis : topologie cassée`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
