"use client";

import { motion, useInView, useAnimation } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

/**
 * Révèle son contenu avec un fade + slide-up quand il entre dans le viewport.
 * Respecte prefers-reduced-motion automatiquement via framer-motion.
 */
export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start({ opacity: 1, y: 0 });
    }
  }, [inView, controls]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={controls}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Variante pour grilles : révélation en cascade (stagger).
 * Wrap chaque enfant dans un motion-item avec un délai progressif.
 */
export function StaggerGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode[];
  className?: string;
  stagger?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className={className}>
      {inView &&
        Array.isArray(children) &&
        children.map((child, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {child}
          </motion.div>
        ))}
    </div>
  );
}
