<tool_call name="read_file">{"limit": 80, "offset": 60, "path": "src/components/map/ArtisansMap.tsx"}</arg_value>

<tool_result name="read_file">
[lignes 60-139 sur 172, pour la suite : read_file avec offset:140]
    const map = L.map(containerRef.current, {
      center: [46.2, 6.14],
      zoom: 12,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
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
    markersRec.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = selectedCategory
      ? artisans.filter(
          (a) => a.category?.name === selectedCategory || !a.category,
        )
      : artisans;

    const withCoords = filtered.filter(
      (a) => a.latitude !== undefined && a.longitude !==,
    );

    withCoords.forEach((a) => {
      const icon = getIcon(a.category?.color);
      const marker = L.marker([a.latitude, a.longitude], { icon }).addTo(map);

      const popupHtml = `<div style="min-width:180px"><strong>${escapeHtml(a.name)}</strong><br/><span style="color:#666;font-size:13px">${escapeHtml(a.craft ?? "")}</span><br/><span style="color:#999;font-size:12px">${escapeHtml(a.commune ?? "")}</span><br/><a href="/artisans/${a.slug}" style="display:inline-block;margin-top:6px;color:#b42c36;font-weight:600;text-decoration:none">Voir la fiche →</a></div>`;

      marker.bindPopup(popupHtml);
      markersRef.current.push(marker);
    });

    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map((a) => [a.latitude, a.longitude]));
      // Filtrer les artisans hors canton pour le calcul des bounds
      const inCanton = withCoords.filter((a) => {
        const lat = a.latitude;
        const lng = a.longitude;
        return lat >= 46.13 && lat <= 46.28 && lng >= 5.95 && lng <= 6.30;
      });
      if (inCanton.length > 0) {
        const cb = L.latLngBounds(inCanton.map((a) => [a.latitude, a.longitude]));
        map.fitBounds(cb.pad(0.2));
      } autoFit();
    }
  }, [artisans, selectedCategory]);

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border border-mag-dark/10 z-10">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
</tool_result>

Je vais implémenter le comportement type Google Maps : scroll bloqué par défaut avec un hint visuel, et ⌘+scroll (Mac) / Ctrl+scroll (Windows) pour zoomer.
<tool_call name="read_file">{"limit": 172, "offset": 140, "path": "src/components/map/ArtisansMap.tsx"}</arg_value>

<tool_result name="read_file">
[lignes 140-172 sur 172]
    </div>
  );
}
</tool_result>

<tool_call name="edit_file">{"newStr": "      scrollWheelZoom: false,", "oldStr": "      scrollWheelZoom: true,", "path": "src/components/map/ArtisansMap.tsx"}</arg_value>

<tool_result name="edit_file">
Modifié src/components/map/ArtisansMap.tsx · +1 -1
</tool_result>

Maintenant je dois ajouter le handler wheel personnalisé et l'overlay hint. Je vais réécrire le composant proprement.
<tool_call name="read_file">{"path": "src/components/map/ArtisanMap.tsx"}</arg_value>

<tool_result name="read_file">
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet

## Faits retenus
- Resend API key configured for metiersdart-geneve project: [REDACTED], from email: contact@jooce.ch (domain verified). AUTH_SECRET also set on Vercel.
