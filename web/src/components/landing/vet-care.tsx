/** Original animated illustration: a vet bandaging a dog's paw. Pure SVG + CSS, no assets. */
export function VetIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 340" className={className} role="img" aria-label="A vet gently bandaging a happy dog's front paw">
      <style>{`
        .tail { transform-origin: 318px 236px; animation: wag .6s ease-in-out infinite alternate; }
        .ear { transform-origin: 266px 150px; animation: twitch 4s ease-in-out infinite; }
        .vet-head { transform-origin: 140px 132px; animation: nod 5s ease-in-out infinite; }
        .wrap { stroke-dasharray: 60; animation: wrap 3.2s ease-in-out infinite; }
        .heart { animation: float 3.2s ease-out infinite; transform-origin: 250px 120px; }
        @keyframes wag { from { transform: rotate(-14deg) } to { transform: rotate(16deg) } }
        @keyframes twitch { 0%, 88%, 100% { transform: rotate(0) } 92% { transform: rotate(-12deg) } 96% { transform: rotate(4deg) } }
        @keyframes nod { 0%, 100% { transform: rotate(0) } 50% { transform: rotate(4deg) } }
        @keyframes wrap { 0% { stroke-dashoffset: 60 } 60%, 100% { stroke-dashoffset: 0 } }
        @keyframes float { 0%, 55% { opacity: 0; transform: translateY(8px) scale(.6) } 70% { opacity: 1 } 100% { opacity: 0; transform: translateY(-34px) scale(1) } }
        @media (prefers-reduced-motion: reduce) { .tail, .ear, .vet-head, .wrap, .heart { animation: none } .heart { opacity: 0 } .wrap { stroke-dashoffset: 0 } }
      `}</style>

      {/* ground + soft backdrop */}
      <ellipse cx="215" cy="306" rx="190" ry="18" fill="hsl(var(--foreground) / .07)" />
      <circle cx="230" cy="170" r="128" fill="hsl(var(--secondary))" />

      {/* ---- Dog ---- */}
      <g>
        <path className="tail" d="M318 236 q34 -10 38 -44" fill="none" stroke="#C98B4E" strokeWidth="12" strokeLinecap="round" />
        <path d="M228 300 q-6 -70 32 -96 q46 -26 66 18 q14 34 -2 78 z" fill="#D9A066" />
        <path d="M300 300 q4 -26 -6 -44" fill="none" stroke="#C98B4E" strokeWidth="14" strokeLinecap="round" />
        <rect x="246" y="250" width="18" height="52" rx="9" fill="#D9A066" />
        {/* the paw being treated */}
        <path d="M232 236 q-30 6 -52 22" fill="none" stroke="#D9A066" strokeWidth="18" strokeLinecap="round" />
        <path className="wrap" d="M196 252 l8 -12 M204 255 l8 -12 M212 252 l6 -10" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
        {/* head */}
        <g className="ear">
          <path d="M262 150 q-22 4 -26 40 q16 2 28 -20 z" fill="#A8693A" />
        </g>
        <ellipse cx="282" cy="176" rx="40" ry="36" fill="#D9A066" />
        <path d="M300 146 q22 -6 30 26 q-16 4 -26 -8 z" fill="#A8693A" />
        <ellipse cx="300" cy="192" rx="22" ry="16" fill="#F1D3AE" />
        <ellipse cx="314" cy="186" rx="7" ry="5.5" fill="hsl(var(--foreground))" />
        <circle cx="282" cy="170" r="4.5" fill="hsl(var(--foreground))" />
        <path d="M300 202 q8 6 16 0" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M262 214 q22 10 44 0" fill="none" stroke="hsl(var(--destructive))" strokeWidth="7" strokeLinecap="round" />
        <circle cx="284" cy="222" r="5" fill="hsl(var(--accent))" />
      </g>

      {/* ---- Vet ---- */}
      <g>
        {/* body in scrubs */}
        <path d="M70 300 q-4 -96 70 -112 q62 8 64 112 z" fill="hsl(var(--primary))" />
        <path d="M120 190 l20 26 l20 -26" fill="none" stroke="hsl(var(--primary-foreground) / .5)" strokeWidth="3" />
        {/* stethoscope */}
        <path d="M118 194 q-6 46 22 52 q28 -6 20 -52" fill="none" stroke="hsl(var(--foreground))" strokeWidth="3" />
        <circle cx="140" cy="248" r="6" fill="hsl(var(--muted))" stroke="hsl(var(--foreground))" strokeWidth="3" />
        {/* arms reaching to the paw */}
        <path d="M168 214 q26 22 30 38" fill="none" stroke="hsl(var(--primary))" strokeWidth="20" strokeLinecap="round" />
        <path d="M110 220 q40 40 92 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="20" strokeLinecap="round" />
        <circle cx="200" cy="256" r="11" fill="#8D5A3B" />
        <circle cx="206" cy="262" r="10" fill="#8D5A3B" />
        {/* head */}
        <g className="vet-head">
          <rect x="128" y="160" width="24" height="24" rx="8" fill="#8D5A3B" />
          <circle cx="140" cy="136" r="34" fill="#8D5A3B" />
          <path d="M104 132 q4 -42 40 -40 q34 2 34 34 q-20 -18 -42 -14 q-18 4 -32 20 z" fill="#2B1B14" />
          <circle cx="156" cy="140" r="3.5" fill="#2B1B14" />
          <path d="M150 156 q8 6 16 -2" fill="none" stroke="#2B1B14" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="164" cy="148" r="5" fill="hsl(var(--destructive) / .25)" />
        </g>
      </g>

      {/* floating heart */}
      <path className="heart" d="M250 120 c-8 -12 -26 -4 -18 10 l18 16 l18 -16 c8 -14 -10 -22 -18 -10 z" fill="hsl(var(--destructive))" />
    </svg>
  );
}

export function CareSection() {
  return (
    <section className="container grid items-center gap-10 py-20 lg:grid-cols-2">
      <VetIllustration className="mx-auto w-full max-w-md" />
      <div className="max-w-lg">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">The rescue is the start. Recovery is the story.</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          After pickup, the NGO posts treatment notes and photos straight to your report: the X-ray, the first meal, the
          bandage coming off. You&apos;ll know exactly how the animal you helped is doing, all the way to release or adoption.
        </p>
      </div>
    </section>
  );
}
