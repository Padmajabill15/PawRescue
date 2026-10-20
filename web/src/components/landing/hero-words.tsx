"use client";

import { motion, useReducedMotion } from "framer-motion";

const WORDS = [
  { text: "Spot it.", color: "hsl(var(--foreground))" },
  { text: "Send it.", color: "hsl(var(--destructive))" },
  { text: "Save it.", color: "hsl(var(--primary))" },
];

/** Outlined words that fill with ink one after another, the page's single load-time moment. */
export function HeroWords() {
  const reduce = useReducedMotion();
  return (
    <h1 className="font-display text-[3.4rem] font-extrabold leading-[0.95] sm:text-7xl lg:text-[5.6rem]">
      {WORDS.map((w, i) => (
        <span key={w.text} className="relative block w-fit">
          {/* outline layer */}
          <span aria-hidden className="block text-transparent" style={{ WebkitTextStroke: `2px ${w.color}` }}>
            {w.text}
          </span>
          {/* fill layer wipes in left to right */}
          <motion.span
            className="absolute inset-0 block"
            style={{ color: w.color }}
            initial={reduce ? false : { clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.9, delay: 0.35 + i * 0.55, ease: [0.65, 0, 0.35, 1] }}
          >
            {w.text}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
