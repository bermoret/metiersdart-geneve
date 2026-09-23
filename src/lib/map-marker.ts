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

/**
 * Artisan·e·s au même point exact (même bâtiment, ou fiche sans adresse placée
 * au centre de sa commune) : les pastilles se superposaient et seule la
 * dernière restait cliquable. Chaque groupe est réparti en cercle autour du
 * point, rayon croissant avec la taille du groupe (~40 m pour 2, ~150 m pour 25) :
 * lisible aux forts zooms ; aux zooms faibles, seul le géocodage des adresses sépare les fiches.
 */
export function spreadOverlapping<T extends { latitude: number; longitude: number }>(
  items: T[],
): (T & { lat: number; lng: number })[] {
  const groups = new Map<string, T[]>();
  for (const it of items) {
    const k = `${it.latitude.toFixed(5)},${it.longitude.toFixed(5)}`;
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }
  return [...groups.values()].flatMap((group) => {
    if (group.length === 1) {
      const [it] = group;
      return [{ ...it, lat: it.latitude, lng: it.longitude }];
    }
    const r = 0.00027 * Math.sqrt(group.length); // degrés de latitude
    return group.map((it, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      const cos = Math.cos((it.latitude * Math.PI) / 180);
      return {
        ...it,
        lat: it.latitude + r * Math.sin(angle),
        lng: it.longitude + (r * Math.cos(angle)) / cos,
      };
    });
  });
}
