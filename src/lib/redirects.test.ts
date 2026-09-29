import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { checkCustomRoutes, type Redirect } from "next/dist/lib/load-custom-routes";
import nextConfig from "../../next.config";
import { allRedirects, JOOMLA_ARTICLES, type RedirectRule } from "./redirects";
import { artisans, artisanCategories, DIRECTORIES } from "./data";

// ─── Routes du nouveau site ────────────────────────────────────

/** Valeurs connues des segments dynamiques de src/app (données statiques = base au 29.09). */
const PARAMS: Record<string, string[]> = {
  "artisans/[slug]": artisans.map((a) => a.slug),
  "categories/[slug]": artisanCategories.map((c) => c.slug),
  "repertoire/[slug]": DIRECTORIES.map((d) => d.slug),
  // Éditions passées en base (/jema/[year] ne sert que celles-ci).
  "jema/[year]": ["2022", "2023", "2024", "2025", "2026"],
};

/**
 * Chemins servis par le nouveau site, déduits de l'arborescence src/app :
 * chaque page / route, segments dynamiques remplacés par leurs valeurs connues
 * (ou un exemple quelconque pour ceux qui n'en ont pas, ex. routes d'API).
 */
function servedPaths(): string[] {
  const appDir = join(__dirname, "../app");
  const out: string[] = ["/robots.txt", "/sitemap.xml", "/favicon.ico", "/icon.png"];
  const walk = (rel: string) => {
    const entries = readdirSync(join(appDir, rel), { withFileTypes: true });
    if (entries.some((e) => e.isFile() && /^(page|route)\.tsx?$/.test(e.name))) {
      const segs = rel.split("/").filter((s) => s && !/^\(.*\)$/.test(s));
      let paths = [""];
      segs.forEach((seg, i) => {
        const dyn = /^\[.+\]$/.test(seg);
        const key = segs.slice(Math.max(0, i - 1), i + 1).join("/");
        const values = dyn ? (PARAMS[key] ?? ["exemple"]) : [seg];
        paths = paths.flatMap((p) => values.map((v) => `${p}/${v}`));
      });
      out.push(...paths.map((p) => p || "/"));
    }
    for (const e of entries) if (e.isDirectory()) walk(rel ? `${rel}/${e.name}` : e.name);
  };
  walk("");
  return out;
}

const SERVED = servedPaths();
const SERVED_SET = new Set(SERVED);

// ─── Résolution, comme Next.js ─────────────────────────────────

// Mêmes options que Next pour compiler les `source` des redirections
// (build-custom-route : strict, insensible à la casse).
const matchers = allRedirects.map((r) => getPathMatch(r.source, { strict: true, sensitive: false }));

/** `has` de type query : valeur = regex ancrée (prepare-destination.matchHas). */
function hasMatches(rule: RedirectRule, query: URLSearchParams): boolean {
  return (rule.has ?? []).every((h) => {
    const v = query.get(h.key);
    if (v === null || v === "") return false;
    return h.value === undefined || new RegExp(`^${h.value}$`).test(v);
  });
}

/** Destination de la première règle qui correspond à `url`, sinon null. */
function resolve(url: string): string | null {
  const u = new URL(url, "https://metiersdart-geneve.ch");
  const i = allRedirects.findIndex((r, i) => matchers[i](u.pathname) && hasMatches(r, u.searchParams));
  return i < 0 ? null : allRedirects[i].destination;
}

// ─── Tests ─────────────────────────────────────────────────────

describe("redirections de l'ancien site Joomla", () => {
  test("configuration acceptée par Next.js (validation de next build)", async () => {
    const routes = (await nextConfig.redirects!()) as Redirect[];
    assert.equal(routes.length, allRedirects.length);
    assert.ok(routes.every((r) => r.permanent === true), "redirections permanentes");
    const exit = process.exit;
    process.exit = ((code?: number) => {
      throw new Error(`redirections refusées par Next.js (exit ${code})`);
    }) as typeof process.exit;
    try {
      checkCustomRoutes(routes, "redirect");
    } finally {
      process.exit = exit;
    }
  });

  test("les routes du nouveau site sont bien inventoriées", () => {
    for (const p of ["/", "/jema", "/medias", "/l-actu", "/repertoire", "/repertoire/partenaires", "/artisans/lucien-walker", "/categories/art-du-cuir", "/jema/2026"]) {
      assert.ok(SERVED_SET.has(p), p);
    }
  });

  test("aucune source ne masque une page du nouveau site", () => {
    for (const [i, r] of allRedirects.entries()) {
      for (const p of SERVED) {
        assert.equal(matchers[i](p), false, `${r.source} masquerait ${p}`);
      }
    }
    // Sans paramètre de requête, les pages servies ne sont jamais redirigées.
    for (const p of SERVED) assert.equal(resolve(p), null, p);
  });

  test("chaque destination est une page du nouveau site", () => {
    for (const r of allRedirects) {
      const path = r.destination.split(/[?#]/)[0];
      assert.ok(SERVED_SET.has(path), `${r.source} → ${r.destination} : page inconnue`);
    }
  });

  test("ancre /#domaines présente sur l'accueil", () => {
    const anchors = allRedirects.map((r) => r.destination.split("#")[1]).filter(Boolean);
    const home = readFileSync(join(__dirname, "../app/page.tsx"), "utf8");
    for (const a of anchors) assert.ok(home.includes(`id="${a}"`), `ancre #${a} absente de l'accueil`);
  });

  test("fiches : identifiants uniques, slugs présents dans les données", () => {
    const ids = JOOMLA_ARTICLES.map(([id]) => id);
    assert.equal(new Set(ids).size, ids.length, "identifiant d'article en double");
    const slugs = new Set(artisans.map((a) => a.slug));
    for (const [id, slug] of JOOMLA_ARTICLES) assert.ok(slugs.has(slug), `article ${id} → ${slug} : fiche inconnue`);
  });

  test("anciennes URLs → nouvelles pages", () => {
    const cases: [string, string][] = [
      ["/lactu-des-artisans", "/l-actu"],
      ["/repertoire/repertoire-complet", "/repertoire"],
      ["/repertoire/artisans-par-domaine", "/#domaines"],
      ["/repertoire/art-de-l-horlogerie-et-de-la-bijouterie", "/categories/art-de-lhorlogerie-et-de-la-bijouterie"],
      ["/repertoire/art-du-cuir", "/categories/art-du-cuir"],
      ["/component/content/article/216-ap-sellerie-anne-ponthenier?catid=2&Itemid=101", "/artisans/ap-sellerie-anne-ponthenier"],
      // Alias périmé : seul l'identifiant compte (297 = Ateliers de décors de théâtre).
      ["/component/content/article/297-collection-des-moulages-de-lunige?Itemid=101", "/artisans/ateliers-de-decors-de-theatre"],
      ["/component/content/article/197-cfp-nature-et-environnement?catid=2&Itemid=101", "/artisans/cfpne-lullier"],
      ["/component/content/article?id=255&Itemid=101", "/artisans/lucien-walker"],
      // Forme Joomla classique id=<id>:<alias> en requête.
      ["/component/content/article?id=216:ap-sellerie-anne-ponthenier&catid=2", "/artisans/ap-sellerie-anne-ponthenier"],
      ["/component/content/article?id=2160", "/repertoire"],
      ["/component/content/article?id=2160:autre", "/repertoire"],
      // /index.php?option=com_content&view=article : mêmes destinations que les fiches.
      ["/index.php?option=com_content&view=article&id=216&Itemid=101", "/artisans/ap-sellerie-anne-ponthenier"],
      ["/index.php?option=com_content&view=article&id=216:ap-sellerie-anne-ponthenier&catid=2", "/artisans/ap-sellerie-anne-ponthenier"],
      ["/index.php?option=com_content&view=article&id=245:metiers-dart-geneve-mag", "/qui-sommes-nous"],
      ["/index.php?option=com_content&view=article&id=2160", "/repertoire"],
      ["/index.php?option=com_content&view=article&id=2160:autre", "/repertoire"],
      ["/index.php?option=com_content&view=category&id=216", "/"],
      ["/component/content/article/245-metiers-dart-geneve-mag?catid=2&Itemid=101", "/qui-sommes-nous"],
      // Identifiant voisin (2160 ≠ 216) ou inconnu : répertoire.
      ["/component/content/article/2160-autre", "/repertoire"],
      ["/component/content/article/290-watchmakers-united?catid=2&Itemid=101", "/repertoire"],
      ["/component/content/article?id=99999", "/repertoire"],
      ["/index.php?option=com_sppagebuilder&view=page&id=476", "/jema/2026"],
      ["/index.php?option=com_sppagebuilder&view=page&id=630", "/repertoire"],
      ["/index.php?option=com_sppagebuilder&view=page&id=4760", "/"],
      ["/index.php", "/"],
    ];
    for (const [from, to] of cases) assert.equal(resolve(from), to, from);
  });
});
