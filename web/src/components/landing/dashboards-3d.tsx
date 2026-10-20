"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { BarChart3, Inbox, PawPrint, Siren } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

function Bar({ w, tone = "bg-primary" }: { w: string; tone?: string }) {
  return <span className={`block h-2 rounded-full ${tone}`} style={{ width: w }} />;
}

const PANELS: { role: string; icon: typeof PawPrint; body: ReactNode }[] = [
  {
    role: "Reporter",
    icon: PawPrint,
    body: (
      <div className="space-y-3">
        <div className="flex gap-1.5">{[1, 1, 1, 0, 0].map((d, i) => <span key={i} className={`h-2 flex-1 rounded-full ${d ? "bg-primary" : "bg-muted"}`} />)}</div>
        <p className="text-xs text-muted-foreground">Team on the way · 8 min</p>
        <div className="h-20 rounded-lg bg-secondary" />
      </div>
    ),
  },
  {
    role: "NGO",
    icon: Inbox,
    body: (
      <div className="space-y-2.5">
        {["critical", "high", "medium"].map((s, i) => (
          <div key={s} className="flex items-center gap-2 rounded-lg border p-2">
            {i === 0 ? <Siren className="h-4 w-4 text-destructive" /> : <span className="h-4 w-4 rounded-full bg-muted" />}
            <Bar w={`${80 - i * 18}%`} tone={i === 0 ? "bg-destructive" : i === 1 ? "bg-accent" : "bg-primary"} />
          </div>
        ))}
      </div>
    ),
  },
  {
    role: "Admin",
    icon: BarChart3,
    body: (
      <div className="flex h-28 items-end gap-1.5">
        {[40, 62, 48, 75, 58, 90, 70, 96].map((h, i) => (
          <span key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  },
];

function TiltCard({ children, index }: { children: ReactNode; index: number }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <motion.div
      style={{ perspective: 900 }}
      initial={reduce ? false : { opacity: 0, y: 80, rotateX: 25 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={index === 1 ? "md:-mt-10" : "md:mt-6"}
    >
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={() => {
          mx.set(0);
          my.set(0);
        }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="rounded-2xl border bg-card p-5 shadow-[0_30px_60px_-30px_hsl(var(--foreground)/0.45)]"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Dashboards3D() {
  return (
    <section className="overflow-hidden py-24">
      <div className="container">
        <h2 className="max-w-xl font-display text-4xl font-bold sm:text-5xl">Three dashboards, one rescue network</h2>
        <p className="mt-4 max-w-lg text-muted-foreground">
          Reporters track their animal, NGOs work a live queue sorted by urgency, and admins see the whole city at a glance.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PANELS.map(({ role, icon: Icon, body }, i) => (
            <TiltCard key={role} index={i}>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-display text-lg font-bold">{role}</span>
              </div>
              {body}
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
