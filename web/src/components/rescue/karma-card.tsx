"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { computeKarma } from "@/lib/karma";
import type { RescueRequest } from "@/lib/requests";
import { cn } from "@/lib/utils";

const SEEN_KEY = "pawrescue:badges-seen";
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--destructive))"];

function Burst() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 120 + (i % 5) * 30;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/3 h-2 w-2 rounded-sm"
            style={{ background: COLORS[i % 3] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 60, opacity: 0, rotate: 360 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export function KarmaCard({ reports }: { reports: RescueRequest[] }) {
  const k = useMemo(() => computeKarma(reports), [reports]);
  const reduce = useReducedMotion();
  const [fresh, setFresh] = useState<string[]>([]);

  // Celebrate badges unlocked since the last visit
  useEffect(() => {
    const unlocked = k.badges.filter((b) => b.unlocked).map((b) => b.id);
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {}
    const newly = unlocked.filter((id) => !seen.includes(id));
    if (newly.length) setFresh(newly);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(unlocked));
    } catch {}
  }, [k.badges]);

  useEffect(() => {
    if (!fresh.length) return;
    const t = setTimeout(() => setFresh([]), 4000);
    return () => clearTimeout(t);
  }, [fresh]);

  return (
    <Card className="relative overflow-hidden">
      <AnimatePresence>{fresh.length > 0 && !reduce && <Burst />}</AnimatePresence>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[260px_1fr]">
        <div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4 text-accent" /> Rescue Karma
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{k.points}</p>
          <p className="mt-1 font-semibold">{k.level}</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${k.pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {k.nextLevel ? `${k.toNext} points to ${k.nextLevel}` : "Top level reached. Thank you!"}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">+10 per report, +20 when rescued, +30 when recovered.</p>
        </div>

        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {k.badges.map((b, i) => (
            <motion.li
              key={b.id}
              title={b.how}
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={fresh.includes(b.id) && !reduce ? { opacity: 1, scale: [1, 1.18, 1] } : { opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 text-center",
                b.unlocked ? "border-accent/50 bg-accent/10" : "opacity-55 grayscale",
                fresh.includes(b.id) && "ring-2 ring-accent",
              )}
            >
              <span className="text-2xl" aria-hidden>{b.emoji}</span>
              <span className="text-xs font-semibold leading-tight">{b.name}</span>
              <span className="text-[10px] leading-tight text-muted-foreground">
                {b.unlocked ? "Unlocked" : b.progress ? `${b.progress[0]}/${b.progress[1]}` : b.how}
              </span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
