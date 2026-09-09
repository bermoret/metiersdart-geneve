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

    // Comportement type Google Maps : Cmd/Ctrl + scroll pour zoomer
    const container = containerRef.current!;
    let overlay: HTMLDivElement | null = null;
    let overlayTimer: ReturnType<typeof setTimeout> | undefined;

    const ensureOverlay = () => {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.style.cssText =
          "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);" +
          "background:rgba(255,255,255,.95);color:#333;padding:10px 18px;" +
          "border-radius:8px;font-size:13px;font-family:sans-serif;" +
          "box-shadow:0 2px 8px rgba(0,0,0,.2);pointer-events:none;z-index:1000;" +
          "white-space:nowrap;opacity:0;transition:opacity .25s";
        overlay.textContent = "\u2318 + molette pour zoomer";
        container.appendChild(overlay);
      }
    };

    const showOverlay = () => {
      ensureOverlay();
      if (overlay) overlay.style.opacity = "1";
      clearTimeout(overlayTimer);
      overlayTimer = setTimeout(() => {
        if (overlay) overlay.style.opacity = "0";
      }, 1500);
    };

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        showOverlay();
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });

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
      container.removeEventListener("wheel", onWheel);
      clearTimeout(overlayTimer);
      if (overlay) overlay.remove();
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
