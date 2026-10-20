"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Camera, HeartPulse, MapPinned, Truck } from "lucide-react";
import { useRef } from "react";
import { LineDog } from "@/components/landing/line-dog";

const STOPS = [
  { icon: Camera, title: "You report", text: "Snap a photo. Your location is filled in, and AI recognises the animal and how badly it's hurt." },
  { icon: MapPinned, title: "NGOs are alerted", text: "Verified NGOs whose area covers the spot get an alert. Emergencies go to the top of their list." },
  { icon: Truck, title: "A team comes", text: "One NGO accepts, so no one is sent twice. You see when they're on the way." },
  { icon: HeartPulse, title: "You see recovery", text: "Treatment notes and photos arrive on your report until the animal is healthy again." },
];

export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="how-it-works" className="dark bg-background text-foreground">
      <div className="container grid gap-14 py-24 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <h2 className="max-w-md font-display text-4xl font-bold sm:text-5xl">From the roadside to recovery, in four stops</h2>
          <LineDog className="mt-10 w-full max-w-md text-primary" />
        </div>

        <ol ref={ref} className="relative space-y-12 pl-14">
          {/* track + scroll-driven fill */}
          <span aria-hidden className="absolute bottom-2 left-[19px] top-2 w-[3px] rounded-full bg-border" />
          <motion.span
            aria-hidden
            className="absolute left-[19px] top-2 w-[3px] origin-top rounded-full bg-primary"
            style={{ height: "calc(100% - 1rem)", scaleY: reduce ? 1 : progress }}
          />
          {STOPS.map(({ icon: Icon, title, text }, i) => (
            <motion.li
              key={title}
              className="relative"
              initial={reduce ? false : { opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <span className="absolute -left-14 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground ring-8 ring-background">
                {i + 1}
              </span>
              <div className="rounded-2xl border bg-card p-6">
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  <Icon className="h-5 w-5 text-primary" /> {title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
