"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { FadeIn } from "@/components/motion/fade-in";

// Placeholder data
const stats = [
  { label: "Animals rescued", value: 1280 },
  { label: "Verified NGOs", value: 64 },
  { label: "Cities covered", value: 18 },
  { label: "Avg. response (min)", value: 12 },
];

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString();
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>0</span>;
}

export function Stats() {
  return (
    <section id="impact" className="scroll-mt-16 bg-primary text-primary-foreground">
      <div className="container py-14">
        <FadeIn>
          <dl className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="text-4xl font-bold tabular-nums sm:text-5xl">
                  <Counter value={s.value} />+
                </dd>
                <dt className="mt-1 text-sm opacity-80">{s.label}</dt>
              </div>
            ))}
          </dl>
        </FadeIn>
      </div>
    </section>
  );
}
