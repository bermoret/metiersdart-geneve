"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapArtisan = {
  id: string;
  name: string;
  slug: string;
  craft?: string | null;
  commune?: string | null;
  latitude: number;
  longitude: number;
  category?: { name: string; color?: string | null } | null;
};

type Props = {
  artisans: MapArtisan[];
  selectedCategory?: string | null;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Usine à icônes — créées paresseusement et mises en cache
const iconCache = new Map<string, L.DivIcon>();

function getIcon(color?: string | null): L.DivIcon {
  const key = color ?? "_default";
  if (iconCache.has(key)) return iconCache.get(key)!;

  const bg = color ?? "#b42c36";
  const size = color ? 12 : 14;
  const anchor = color ? 8 : 9;

  const icon = L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${bg};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:transform .15s"></div>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [anchor, anchor],
  });
  iconCache.set(key, icon);
  return icon;
}

// Petit décalage pour éviter que les marqueurs d'une même commune se superposent exactement
function jitter(lat: number, lng: number, index: number): [number, number] {
  // Décalage en spirale déterministe basé sur l'index
  const angle = (index * 2.39996) % (2 * Math.PI); // golden angle
  const radius = 0.0008 * Math.sqrt(index + 1);
  return [
    lat + radius * Math.cos(angle),
    lng + radius * Math.sin(angle),
  ];
}

export default function ArtisansMap({ artisans, selectedCategory }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Init map une seule fois
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [46.2044, 6.1432], // Genève
      zoom: 12,
      scrollWheelZoom: true, // activé, mais filtré par le handler ci-dessous
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Comportement type Google Maps :
    // - scroll seul = défilement de la page + overlay "⌘ + molette"
    // - Cmd/Ctrl + scroll = zoom sur la carte
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
        // Pas de touche : empêcher Leaflet de zoomer (stopPropagation en capture)
        // mais NE PAS preventDefault pour laisser la page défiler naturellement
        e.stopPropagation();
        showOverlay();
      }
      // Avec Cmd/Ctrl : ne rien faire, Leaflet zoome
    };

    container.addEventListener("wheel", onWheel, { capture: true, passive: true });

    mapRef.current = map;

    return () => {
      container.removeEventListener("wheel", onWheel);
      if (overlay) overlay.remove();
      clearTimeout(overlayTimer);
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Recalculer la taille quand le conteneur change de dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mapRef.current) return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Mettre à jour les marqueurs quand les données ou le filtre changent
  useEffect(() => {
    if (!mapRef.current) return;

    // Nettoyer anciens marqueurs
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = selectedCategory
      ? artisans.filter(
          (a) => a.category?.name === selectedCategory || !a.category,
        )
      : artisans;

    // Filtrer les artisans hors canton de Genève pour le centrage
    // Genève : lat ~46.13-46.26, lon ~6.05-6.27
    const isInGeneva = (lat: number, lng: number) =>
      lat >= 46.12 && lat <= 46.27 && lng >= 6.04 && lng <= 6.28;

    const withCoords = filtered.filter(
      (a) => a.latitude !== 0 && a.longitude !== 0 && !isNaN(a.latitude),
    );

    if (withCoords.length === 0) return;

    const bounds = L.latLngBounds([]);

    withCoords.forEach((artisan) => {
      const lat = artisan.latitude;
      const lng = artisan.longitude;
      const icon = getIcon(artisan.category?.color);

      const marker = L.marker([lat, lng], { icon });

      const popupHtml = `
        <div style="min-width:200px;max-width:280px;font-family:sans-serif">
          <h3 style="font-weight:bold;font-size:15px;margin-bottom:4px;color:#b42c36">${escapeHtml(artisan.name)}</h3>
          ${artisan.craft ? `<p style="font-size:13px;color:#555;margin-bottom:4px">${escapeHtml(artisan.craft)}</p>` : ""}
          ${artisan.commune ? `<p style="font-size:12px;color:#888;margin-bottom:8px">${escapeHtml(artisan.commune)}</p>` : ""}
          <a href="/artisans/${encodeURIComponent(artisan.slug)}"
             style="display:inline-block;padding:6px 16px;background:#b42c36;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:500">
            Voir la fiche
          </a>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.addTo(mapRef.current!);
      // Ne calculer les bounds qu'avec les artisans dans le canton
      if (isInGeneva(lat, lng)) {
        bounds.extend([lat, lng]);
      }
      markersRef.current.push(marker);
    });

    if (bounds.isValid()) {
      if (selectedCategory) {
        // Zoom sur les résultats filtrés
        mapRef.current.fitBounds(bounds.pad(0.15));
      } else {
        // Vue d'ensemble du canton au premier rendu
        mapRef.current.fitBounds(bounds.pad(0.1));
      }
    }
  }, [artisans, selectedCategory]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] sm:h-[500px] rounded-xl overflow-hidden border border-mag-cream shadow-sm"
      aria-label="Carte des artisans de Genève"
      role="application"
    />
  );
}
