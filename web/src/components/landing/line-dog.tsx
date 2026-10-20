"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Line-art dog that draws itself when scrolled into view (blueprint-style). */
export function LineDog({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const paths = [
    // body + back legs
    "M60 230 C 60 170, 110 150, 170 152 C 220 154, 250 170, 262 200 L 270 262",
    "M90 214 L 82 268 M120 222 L 118 268 M236 214 L 232 268",
    // belly + chest
    "M64 210 C 110 240, 200 236, 240 214 C 252 208, 258 204, 262 200",
    // tail
    "M64 186 C 30 170, 22 132, 40 112",
    // neck + head
    "M250 176 C 262 140, 270 118, 300 104 C 334 90, 366 104, 372 130 C 378 156, 352 168, 330 166",
    // snout + nose
    "M330 166 C 316 170, 300 160, 300 146 M366 126 C 382 126, 392 134, 390 144 C 386 152, 372 152, 364 146",
    // ear
    "M306 104 C 290 80, 296 60, 316 62 C 330 70, 326 92, 318 106",
    // eye + collar + tag
    "M338 120 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0",
    "M262 164 C 278 176, 300 178, 318 170",
    "M290 178 m -7 0 a 7 7 0 1 0 14 0 a 7 7 0 1 0 -14 0",
    // bandaged front paw
    "M262 200 C 280 214, 300 226, 318 238 M296 222 l 12 -14 M306 230 l 12 -14",
  ];
  return (
    <svg viewBox="0 0 420 290" className={className} fill="none" aria-hidden>
      {/* blueprint grid */}
      <g stroke="currentColor" strokeOpacity="0.07">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 30} 0 V290`} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 30} H420`} />
        ))}
      </g>
      {paths.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={i === 10 ? "hsl(var(--accent))" : i === 8 || i === 9 ? "hsl(var(--destructive))" : "currentColor"}
          strokeWidth={i === 10 ? 5 : 3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.1, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
      <motion.path
        d="M20 276 H400"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeDasharray="6 8"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4 }}
      />
    </svg>
  );
}
