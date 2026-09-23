"use client";

import { motion } from "framer-motion";

type Props = {
  items: string[];
  className?: string;
  speed?: number;
  /** `band` : bandeau rouge plein, métiers en blanc (refonte éditoriale). */
  variant?: "soft" | "band";
};

/**
 * Bande défilante horizontale infinie.
 * `speed` en secondes pour un cycle complet (défaut 30s).
 */
export function Marquee({ items, className, speed = 30, variant = "soft" }: Props) {
  const doubled = [...items, ...items];
  const band = variant === "band";

  return (
    <div
      className={`relative overflow-hidden ${band ? "bg-mag-red py-5 sm:py-7" : ""} ${className ?? ""}`}
      aria-hidden
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className={`font-serif flex items-center gap-8 shrink-0 ${
              band
                ? "text-2xl sm:text-4xl font-medium text-white"
                : "text-2xl sm:text-3xl font-bold text-mag-red/20"
            }`}
          >
            {item}
            <span className={band ? "text-mag-cream text-lg sm:text-xl" : "text-mag-red/40 text-sm"}>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
