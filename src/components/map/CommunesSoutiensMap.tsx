"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapCommune = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  soutientMag: boolean;
};

type Props = {
  communes: MapCommune[];
};

export default function CommunesSoutiensMap({ communes }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [46.2044, 6.1432],
      zoom: 11,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "&copy; Esri, HERE, Garmin &copy; OpenStreetMap contributors",
        maxZoom: 16,
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = L.latLngBounds([]);

    communes.forEach((c) => {
      const isSoutien = c.soutientMag;
      const color = isSoutien ? "#b42c36" : "#cccccc";
      const size = isSoutien ? 14 : 10;

      const icon = L.divIcon({
        className: "",
        html: `<div class="mag-commune-marker" style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.25);${isSoutien ? "animation:mag-marker-pulse 2s ease-in-out infinite;" : ""}"></div>`,
        iconSize: [size + 4, size + 4],
        iconAnchor: [(size + 4) / 2, (size + 4) / 2],
      });

      const marker = L.marker([c.latitude, c.longitude], { icon });

      const popupHtml = `
        <div style="min-width:180px;font-family:sans-serif">
          <h3 style="font-weight:bold;font-size:15px;margin-bottom:6px;color:#b42c36">${escapeHtml(c.name)}</h3>
          <p style="font-size:13px;color:#555;margin-bottom:8px">
            ${isSoutien
              ? '<span style="color:#b42c36;font-weight:600">✓ Commune qui soutient MAG</span>'
              : '<span style="color:#999">Commune non-soutien</span>'}
          </p>
          ${!isSoutien
            ? '<p style="font-size:12px;color:#888;font-style:italic">Cette commune ne soutient pas encore MAG. Pour rejoindre le dispositif, contactez l\'association.</p>'
            : ""}
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.addTo(mapRef.current!);
      bounds.extend([c.latitude, c.longitude]);
      markersRef.current.push(marker);
    });

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds.pad(0.12));
    }
  }, [communes]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden isolate border border-mag-cream/60 shadow-md bg-mag-sand"
      aria-label="Carte des communes qui soutiennent MAG"
      role="application"
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
