"use client";

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
  value: number;
  duration?: number;
  className?: string;
};

/**
 * Compteur qui s'incrémente de 0 à `value` quand il entre dans le viewport.
 */
export function AnimatedCounter({ value, duration = 1.5, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, motionValue, value]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest).toString();
      }
    });
  }, [spring]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
