"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { communeKey } from "@/lib/utils";
// Territoires des 45 communes (swisstopo) — généré par scripts/build-communes-geo.ts.
import geCommunes from "@/lib/ge-communes.json";

export type MapCommune = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  soutientMag: boolean;
  /** Au moins un·e artisan·e du répertoire dans la commune (sinon : partenaire « en recherche »). */
  hasArtisans?: boolean;
};

type Props = {
  communes: MapCommune[];
};

/** Partenaire avec artisan·e·s, partenaire en recherche d'artisan·e·s, ou non partenaire. */
type Statut = "partenaire" | "recherche" | "autre";
type CommuneProps = { name: string; bfs: number; statut: Statut };

const territories = geCommunes as unknown as FeatureCollection<
  Polygon | MultiPolygon,
  { name: string; bfs: number }
>;

// Couleurs reprises par la légende (CommunesMapSection).
const PARTENAIRE = { fillColor: "#b42c36", fillOpacity: 0.6 };
const NEUTRE = { fillColor: "#a8a29e", fillOpacity: 0.3 };
const FALLBACK_PANE = "communes-repli";

function statutOf(c: MapCommune | undefined): Statut {
  if (!c?.soutientMag) return "autre";
  return c.hasArtisans === false ? "recherche" : "partenaire";
}

function styleFor(statut: Statut): L.PathOptions {
  // En recherche d'artisan·e·s : fond neutre cerclé de rouge (légende de MAG).
  if (statut === "recherche") return { ...NEUTRE, color: "#b42c36", weight: 2.5, opacity: 1 };
  return { ...(statut === "partenaire" ? PARTENAIRE : NEUTRE), color: "#ffffff", weight: 1.2, opacity: 1 };
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
            path.setStyle({ weight: 2.5, fillOpacity: statut === "partenaire" ? 0.8 : 0.45 });
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
      aria-label="Carte des communes partenaires de MAG"
      role="application"
    />
  );
}

function popupHtml(name: string, statut: Statut): string {
  const mention =
    statut === "autre"
      ? ""
      : `<p style="font-size:13px;margin-bottom:4px"><span style="color:#b42c36;font-weight:600">✓ Commune partenaire</span>${
          statut === "recherche" ? '<br><span style="color:#555">En recherche d\'artisan·e·s</span>' : ""
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
