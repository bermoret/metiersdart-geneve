import { normalizeHex } from "./utils";

/**
 * Pastille d'un artisan sur la carte d'accueil. Leaflet injecte `html` en
 * innerHTML : la couleur de catégorie (saisie dans l'admin) n'y entre que
 * normalisée en `#rrggbb` ; absente ou invalide → pastille rouge MAG, plus grande.
 */
export function artisanMarker(raw?: string | null): {
  key: string;
  html: string;
  size: number;
  anchor: number;
} {
  const color = normalizeHex(raw);
  const dot = color ? 12 : 14;
  const size = dot + 4; // bordure blanche de 2 px
  return {
    key: color ?? "_default",
    html: `<div class="mag-marker" style="width:${dot}px;height:${dot}px;background:${color ?? "#b42c36"};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
    size,
    anchor: size / 2,
  };
}
