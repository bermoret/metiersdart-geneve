"use client";

import { useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

type Props = {
  items: string[];
  className?: string;
  speed?: number;
};

/**
 * Bande défilante horizontale infinie (décorative, masquée aux lecteurs d'écran).
 * `speed` en secondes pour un cycle complet (défaut 30s).
 * Accessibilité (WCAG 2.2.2) : bouton pause / lecture au clavier, pause au
 * survol ; aucun mouvement si l'utilisateur demande à réduire les animations
 * (framer-motion ignore la règle CSS `prefers-reduced-motion`).
 */
export function Marquee({ items, className, speed = 30 }: Props) {
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const doubled = [...items, ...items];

  // Avancement dans le cycle (0 → 1), conservé à la pause
  const progress = useMotionValue(0);
  const x = useTransform(progress, (p) => `${-p * 50}%`);
  useAnimationFrame((_, delta) => {
    if (reduceMotion || paused || hovered) return;
    progress.set((progress.get() + delta / (speed * 1000)) % 1);
  });

  return (
    <div className={`relative ${className ?? ""}`}>
      <div
        className="overflow-hidden"
        aria-hidden
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <motion.div className="flex gap-8 whitespace-nowrap" style={{ x }}>
          {doubled.map((item, i) => (
            <span
              key={i}
              className="font-serif flex items-center gap-8 shrink-0 text-2xl sm:text-3xl font-bold text-mag-red/20"
            >
              {item}
              <span className="text-mag-red/40 text-sm">✦</span>
            </span>
          ))}
        </motion.div>
      </div>
      {/* Masqué en CSS (et non rendu conditionnel) : pas d'écart d'hydratation */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Reprendre le défilement des métiers" : "Mettre en pause le défilement des métiers"}
        className="motion-reduce:hidden absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 text-mag-red border border-mag-cream shadow-sm hover:bg-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          {paused ? <path d="M8 5v14l11-7z" /> : <path d="M6 5h4v14H6zM14 5h4v14h-4z" />}
        </svg>
      </button>
    </div>
  );
}
