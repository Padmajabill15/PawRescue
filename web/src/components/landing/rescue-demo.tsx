"use client";

import { Check, MapPin, Siren } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Reported", note: "Photo and location received" },
  { label: "PetIndia accepted", note: "Nearest verified NGO, 1.4 km away" },
  { label: "Team on the way", note: "Arriving in about 8 minutes" },
  { label: "Rescued", note: "Stabilised and taken to the shelter" },
];

/** A phone-sized replay of one rescue. Plays once on load; respects reduced motion. */
export function RescueDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(STEPS.length - 1);
      return;
    }
    const timers = STEPS.slice(1).map((_, i) => setTimeout(() => setStep(i + 1), 1400 * (i + 1) + 600));
    return () => timers.forEach(clearTimeout);
  }, []);

  const travelled = step >= 2;

  return (
    <div className="relative mx-auto w-full max-w-[340px]" aria-label="Example rescue, from report to rescue">
      <div className="rounded-[2.4rem] border-[10px] border-foreground bg-card shadow-[0_30px_60px_-20px_hsl(var(--foreground)/0.35)]">
        {/* Map */}
        <div className="relative h-56 overflow-hidden rounded-t-[1.7rem] bg-secondary">
          <svg viewBox="0 0 320 224" className="absolute inset-0 h-full w-full" aria-hidden>
            <g stroke="hsl(var(--card))" strokeWidth="10" strokeLinecap="round">
              <path d="M-10 60 H330" />
              <path d="M-10 150 H330" />
              <path d="M70 -10 V240" />
              <path d="M215 -10 V240" />
              <path d="M-10 210 L120 100 L330 20" strokeWidth="6" />
            </g>
            <path
              d="M70 190 V150 H215 V60 H250"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="400"
              style={{ strokeDashoffset: step >= 1 ? 0 : 400, transition: "stroke-dashoffset 2.6s ease-in-out" }}
            />
          </svg>
          {/* NGO van */}
          <span
            className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-4 ring-card transition-all duration-[2600ms] ease-in-out"
            style={{ left: travelled ? "75%" : "22%", top: travelled ? "29%" : "85%" }}
          >
            NGO
          </span>
          {/* Animal */}
          <span className="absolute left-[78%] top-[27%] -translate-x-1/2 -translate-y-full text-destructive">
            <MapPin className="h-9 w-9 fill-destructive stroke-card" />
          </span>
        </div>

        {/* Bottom sheet */}
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold leading-tight">Dog hit by a bike</p>
              <p className="text-sm text-muted-foreground">Near Ashok Nagar market</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
              <Siren className="h-3.5 w-3.5" /> SOS
            </span>
          </div>

          <ol className="space-y-2.5">
            {STEPS.map((s, i) => (
              <li key={s.label} className={cn("flex gap-3 transition-opacity duration-500", i > step && "opacity-35")}>
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500",
                    i <= step ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {i <= step && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="text-sm leading-tight">
                  <span className="font-semibold">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">{s.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* AI triage tag, pinned to the phone */}
      <div className="absolute -left-6 top-40 hidden w-36 -rotate-6 rounded-md bg-accent p-3 text-accent-foreground shadow-lg sm:block">
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-card" aria-hidden />
        <p className="text-[11px] font-semibold">AI triage</p>
        <p className="font-display text-2xl font-extrabold leading-none">86</p>
        <p className="text-[11px]">critical, out of 100</p>
      </div>
    </div>
  );
}
