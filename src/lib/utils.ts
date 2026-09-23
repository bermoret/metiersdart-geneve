// Slugify helper
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// Helper: latitude/longitude stockées en microdegrés (int) -> degres decimaux
export function latFromDB(microdeg: number | null): number | null {
  if (microdeg === null) return null;
  return microdeg / 1e6;
}
export function latToDB(deg: number): number {
  return Math.round(deg * 1e6);
}

// ─── Couleurs : format et contraste (WCAG 2) ───────────────────

/** `#rgb`, `#rrggbb`, avec ou sans `#`, espaces et casse tolérés → `#rrggbb` ; sinon null. */
export function normalizeHex(raw: string | null | undefined): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((raw ?? "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, "$&$&") : m[1];
  return "#" + h.toLowerCase();
}

/**
 * Format stocké d'une couleur de catégorie : `#rrggbb` strict, rien d'autre.
 * Règle des routes admin (et de la contrainte CHECK proposée en base) : la
 * couleur finit dans du HTML (marqueurs Leaflet) et du CSS inline.
 */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function luminance(hex: string): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Rapport de contraste WCAG entre deux `#rrggbb` normalisés. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const toHex = (c: number[]) =>
  "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

const TINT_ALPHA = 0x20 / 255;

/**
 * Couleur de texte d'une puce teintée (fond = la couleur à 12,5 % sur blanc).
 * Renvoie la couleur telle quelle si elle atteint déjà `min`:1 sur ce fond,
 * sinon l'assombrit juste assez. Seuil 4.7 et non 4.5 : la marge couvre le
 * survol de ligne du répertoire (`bg-mag-cream/20`). `hex` doit être normalisé.
 */
export function readableOnTint(hex: string, min = 4.7): string {
  const c = rgb(hex);
  const bg = toHex(c.map((v) => v * TINT_ALPHA + 255 * (1 - TINT_ALPHA)));
  for (let k = 0; k < 20; k++) {
    const candidate = toHex(c.map((v) => v * (1 - k / 20)));
    if (contrastRatio(candidate, bg) >= min) return candidate;
  }
  return "#000000";
}

/**
 * Styles d'une puce domaine. Les couleurs viennent de l'admin : certaines
 * (papier, horlogerie, verre…) tombent à 2–3:1 en texte ; une valeur invalide
 * retombe sur un gris au lieu de produire un CSS cassé (`"#999" + "20"`).
 */
export function chipColors(raw: string | null | undefined): {
  backgroundColor: string;
  color: string;
} {
  const hex = normalizeHex(raw) ?? "#999999";
  return { backgroundColor: hex + "20", color: readableOnTint(hex) };
}

/**
 * Vrai si next/image peut optimiser cette source : chemin local ou hôte
 * déclaré dans `images.remotePatterns` (next.config.ts). Sinon il faut
 * `unoptimized`, faute de quoi next/image lève une erreur au rendu.
 */
export function canOptimizeImage(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return (
      host === "metiersdart-geneve.ch" ||
      host === "vercel-blob.com" ||
      host.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}
