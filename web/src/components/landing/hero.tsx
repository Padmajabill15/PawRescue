"use client";

import { motion } from "framer-motion";
import { Siren } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      <div className="container flex flex-col items-center py-16 text-center sm:py-24">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-primary"
        >
          Verified rescue NGOs, near you
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          Found an injured animal? <span className="text-primary">Help is minutes away.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Share a photo and your location. The nearest verified NGO accepts, rescues, and keeps you
          updated until the animal recovers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-destructive animate-sos-ping" aria-hidden />
            <Button
              asChild
              variant="destructive"
              className="relative h-32 w-32 rounded-full text-xl font-extrabold shadow-xl sm:h-36 sm:w-36"
            >
              <Link href="/sos" aria-label="Send an emergency SOS">
                <span className="flex flex-col items-center gap-1">
                  <Siren className="h-8 w-8" />
                  SOS
                </span>
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Emergency? Sign in with Google and report in seconds.
          </p>
          <Button asChild variant="link">
            <Link href="/report">Or file a regular report</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
