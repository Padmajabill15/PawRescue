"use client";

import { useReducedMotion } from "framer-motion";

const BASES = [
  { id: "a", x: 120, y: 120 },
  { id: "b", x: 430, y: 90 },
  { id: "c", x: 300, y: 300 },
];

// Each call: where it happens, which base answers, the street route taken, when it starts (s)
const CALLS = [
  { x: 210, y: 70, base: "a", route: "M120 120 H210 V70", t: 0 },
  { x: 520, y: 210, base: "b", route: "M430 90 V210 H520", t: 1.6 },
  { x: 180, y: 300, base: "c", route: "M300 300 H180", t: 3.2 },
  { x: 360, y: 180, base: "c", route: "M300 300 V180 H360", t: 4.8 },
  { x: 60, y: 250, base: "a", route: "M120 120 V250 H60", t: 6.4 },
];
const CYCLE = 8;

export function LiveMap() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden py-24">
      <div className="container grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-bold sm:text-5xl">Every pulse is someone asking for help</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Orange is a new report. Green is the nearest verified NGO answering it, along real streets, with the reporter
            watching the van get closer.
          </p>
          <div className="mt-8 flex gap-6 text-sm">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-destructive shadow-[0_0_12px_hsl(var(--destructive))]" />Report</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />NGO base</span>
            <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-primary" />Route</span>
          </div>
        </div>

        <div className="relative rounded-3xl border bg-card p-3 shadow-[0_40px_120px_-40px_hsl(var(--primary)/0.35)]">
          <svg viewBox="0 0 600 380" className="w-full" role="img" aria-label="Animated city map with rescue reports and NGO routes">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <style>{`
                .call { opacity: 0; animation: call ${CYCLE}s infinite; }
                .ring { transform-box: fill-box; transform-origin: center; animation: ring ${CYCLE}s infinite; opacity: 0; }
                .route { stroke-dasharray: 400; stroke-dashoffset: 400; animation: route ${CYCLE}s infinite; }
                @keyframes call { 0% { opacity: 0 } 4% { opacity: 1 } 70% { opacity: 1 } 80%, 100% { opacity: 0 } }
                @keyframes ring { 0% { opacity: .9; transform: scale(.4) } 20% { opacity: 0; transform: scale(2.4) } 100% { opacity: 0 } }
                @keyframes route { 0%, 8% { stroke-dashoffset: 400 } 30%, 70% { stroke-dashoffset: 0; opacity: 1 } 80%, 100% { stroke-dashoffset: 0; opacity: 0 } }
                @media (prefers-reduced-motion: reduce) { .call, .ring, .route { animation: none } .call { opacity: 1 } .route { stroke-dashoffset: 0 } }
              `}</style>
            </defs>

            {/* city: river, blocks, streets */}
            <path d="M-10 340 C 120 300, 200 360, 330 330 S 520 270, 610 300" fill="none" stroke="hsl(var(--primary) / .12)" strokeWidth="26" />
            <g stroke="hsl(var(--foreground) / .07)" strokeWidth="9" strokeLinecap="round">
              {[70, 120, 180, 250, 300].map((y) => <path key={`h${y}`} d={`M20 ${y} H580`} />)}
              {[60, 120, 210, 300, 360, 430, 520].map((x) => <path key={`v${x}`} d={`M${x} 30 V350`} />)}
            </g>
            <g stroke="hsl(var(--foreground) / .04)" strokeWidth="3">
              {[95, 150, 215, 275].map((y) => <path key={`hh${y}`} d={`M20 ${y} H580`} />)}
              {[90, 165, 255, 330, 395, 475, 550].map((x) => <path key={`vv${x}`} d={`M${x} 30 V350`} />)}
            </g>

            {/* routes + calls, staggered in a loop */}
            {CALLS.map((c, i) => (
              <g key={i} style={{ animationDelay: reduce ? undefined : `${c.t}s` }}>
                <path className="route" style={{ animationDelay: `${c.t}s` }} d={c.route} fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
                <g className="call" style={{ animationDelay: `${c.t}s` }}>
                  <circle className="ring" style={{ animationDelay: `${c.t}s` }} cx={c.x} cy={c.y} r="16" fill="none" stroke="hsl(var(--destructive))" strokeWidth="3" />
                  <circle cx={c.x} cy={c.y} r="7" fill="hsl(var(--destructive))" filter="url(#glow)" />
                </g>
              </g>
            ))}

            {/* NGO bases */}
            {BASES.map((b) => (
              <g key={b.id} filter="url(#glow)">
                <rect x={b.x - 11} y={b.y - 11} width="22" height="22" rx="6" fill="hsl(var(--primary))" />
                <path d={`M${b.x - 5} ${b.y} h10 M${b.x} ${b.y - 5} v10`} stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
