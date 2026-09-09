"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
};

export default function ArtisanMap({ latitude, longitude, name, address }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:18px;height:18px;background:#b42c36;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([latitude, longitude], { icon });
    const popupHtml = `
      <div style="min-width:180px;font-family:sans-serif">
        <h3 style="font-weight:bold;font-size:14px;margin-bottom:4px;color:#b42c36">${name.replace(/</g, "&lt;")}</h3>
        ${address ? `<p style="font-size:12px;color:#888;margin:0">${address.replace(/</g, "&lt;")}</p>` : ""}
      </div>
    `;
    marker.bindPopup(popupHtml);
    marker.addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, name, address]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mapRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[300px] sm:h-[350px] rounded-xl overflow-hidden border border-mag-cream shadow-sm"
      aria-label="Carte de localisation de l'artisan"
      role="application"
    />
  );
}
