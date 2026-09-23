"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { communeKey } from "@/lib/utils";
// Territoires des 45 communes (swisstopo) — généré par scripts/build-communes-geo.ts.
import geCommunes from "@/lib/ge-communes.json";
import { COMMUNE_COLORS, COMMUNE_LABELS } from "./communes-palette";

export type MapCommune = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  soutientMag: boolean;
  /** Au moins un·e artisan·e du répertoire dans la commune : partenaire « avec artisan·e·s »
   *  (sinon « en recherche »), ou commune rose si elle n'est pas partenaire. */
  hasArtisans?: boolean;
};

type Props = {
  communes: MapCommune[];
};

/** Les catégories de la carte de MAG, plus « autre » (ni partenaire ni artisan·e). */
type Statut = "partenaire" | "recherche" | "artisans" | "autre";
type CommuneProps = { name: string; bfs: number; statut: Statut };

const territories = geCommunes as unknown as FeatureCollection<
  Polygon | MultiPolygon,
  { name: string; bfs: number }
>;

const FILL: Record<Statut, L.PathOptions> = {
  partenaire: { fillColor: COMMUNE_COLORS.or, fillOpacity: 0.85 },
  recherche: { fillColor: COMMUNE_COLORS.gris, fillOpacity: 0.55 }, // + contour or (styleFor)
  artisans: { fillColor: COMMUNE_COLORS.rose, fillOpacity: 0.85 },
  autre: { fillColor: COMMUNE_COLORS.gris, fillOpacity: 0.55 },
};
const FALLBACK_PANE = "communes-repli";

function statutOf(c: MapCommune | undefined): Statut {
  if (c?.soutientMag) return c.hasArtisans === false ? "recherche" : "partenaire";
  return c?.hasArtisans ? "artisans" : "autre";
}

function styleFor(statut: Statut): L.PathOptions {
  // En recherche d'artisan·e·s : fond gris cerclé d'or (légende de MAG).
  if (statut === "recherche") return { ...FILL.recherche, color: COMMUNE_COLORS.or, weight: 3, opacity: 1 };
  return { ...FILL[statut], color: "#ffffff", weight: 1.2, opacity: 1 };
}

export default function CommunesSoutiensMap({ communes }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [46.2044, 6.1432],
      zoom: 11,
      // Le canton (~27 km de haut) déborde du cadre au zoom 11 et flotte au
      // zoom 10 : le quart de niveau permet au fitBounds de le cadrer au plus juste.
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      zoomControl: true,
      attributionControl: true,
    });

    // Cadrage unique sur le canton : les territoires ne changent pas, et un
    // rafraîchissement des données ne doit pas écraser le zoom du visiteur.
    map.fitBounds(L.geoJSON(territories).getBounds().pad(0.04));

    // Points de repli au-dessus des territoires, même après un bringToFront.
    map.createPane(FALLBACK_PANE).style.zIndex = "450";

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "&copy; Esri, HERE, Garmin &copy; OpenStreetMap contributors · Limites communales &copy; swisstopo",
        maxZoom: 16,
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.forEach((l) => l.remove());
    layersRef.current = [];

    // Deux fiches pour la même commune (« Grand-Saconnex » et « Le Grand-Saconnex »,
    // que l'unicité du nom en base laisse passer) : il suffit que l'une soutienne.
    const byKey = new Map<string, MapCommune>();
    for (const c of communes) {
      const k = communeKey(c.name);
      const prev = byKey.get(k);
      byKey.set(
        k,
        prev
          ? {
              ...prev,
              soutientMag: prev.soutientMag || c.soutientMag,
              hasArtisans: prev.hasArtisans || c.hasArtisans,
            }
          : c,
      );
    }
    const matched = new Set<string>();

    const data: FeatureCollection<Polygon | MultiPolygon, CommuneProps> = {
      type: "FeatureCollection",
      features: territories.features.map((f) => {
        const k = communeKey(f.properties.name);
        const c = byKey.get(k);
        if (c) matched.add(k);
        return {
          ...f,
          properties: { ...f.properties, name: c?.name ?? f.properties.name, statut: statutOf(c) },
        };
      }),
    };

    // Contours « en recherche » gardés au premier plan (sinon recouverts par le
    // liseré blanc des voisins après un survol).
    const recherche: L.Path[] = [];
    const layer = L.geoJSON(data, {
      style: (f) => styleFor(f?.properties.statut ?? "autre"),
      onEachFeature: (f: Feature<Polygon | MultiPolygon, CommuneProps>, l) => {
        const { name, statut } = f.properties;
        if (statut === "recherche") recherche.push(l as L.Path);
        l.bindTooltip(escapeHtml(name), { sticky: true, direction: "top", offset: [0, -8] });
        l.bindPopup(popupHtml(name, statut));
        l.on({
          mouseover: () => {
            const path = l as L.Path;
            path.setStyle({ weight: 3, fillOpacity: statut === "partenaire" || statut === "artisans" ? 1 : 0.75 });
            path.bringToFront();
          },
          mouseout: () => {
            layer.resetStyle(l);
            recherche.forEach((r) => r.bringToFront());
          },
        });
      },
    }).addTo(map);
    recherche.forEach((r) => r.bringToFront());
    layersRef.current.push(layer);

    // Commune de la base sans territoire connu (nom mal orthographié, commune
    // hors canton…) : repli sur l'ancien point, pour ne pas la perdre.
    [...byKey.entries()]
      .filter(([k, c]) => !matched.has(k) && (c.latitude || c.longitude))
      .forEach(([, c]) => {
        const marker = L.circleMarker([c.latitude, c.longitude], {
          ...styleFor(statutOf(c)),
          radius: 6,
          weight: 2,
          pane: FALLBACK_PANE,
        })
          .bindTooltip(escapeHtml(c.name))
          .bindPopup(popupHtml(c.name, statutOf(c)))
          .addTo(map);
        layersRef.current.push(marker);
      });
  }, [communes]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden isolate border border-mag-cream/60 shadow-md bg-mag-sand"
      aria-label="Carte des communes partenaires de MAG et des communes où exercent des artisan·e·s"
      role="application"
    />
  );
}

function popupHtml(name: string, statut: Statut): string {
  // Libellés fixes (pas de donnée saisie) ; seul le nom est échappé.
  const mention =
    statut === "autre"
      ? ""
      : `<p style="font-size:13px;margin-bottom:4px;color:#323848">${
          statut === "artisans" ? COMMUNE_LABELS.artisans : `✓ ${COMMUNE_LABELS[statut]}`
        }</p>`;
  return `
    <div style="min-width:160px;font-family:sans-serif">
      <h3 style="font-weight:bold;font-size:15px;margin-bottom:6px;color:#b42c36">${escapeHtml(name)}</h3>
      ${mention}
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
