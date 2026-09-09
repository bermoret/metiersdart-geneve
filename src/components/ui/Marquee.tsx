"use client";

import { motion } from "framer-motion";

type Props = {
  items: string[];
  className?: string;
  speed?: number;
};

/**
 * Bande défilante horizontale infinie.
 * `speed` en secondes pour un cycle complet (défaut 30s).
 */
export function Marquee({ items, className, speed = 30 }: Props) {
  const doubled = [...items, ...items];

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
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
            className="text-2xl sm:text-3xl font-serif font-bold text-mag-red/20 flex items-center gap-8 shrink-0"
          >
            {item}
            <span className="text-mag-red/40 text-sm">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
