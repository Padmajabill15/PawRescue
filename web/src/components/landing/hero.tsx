"use client";

import { Siren } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RescueDemo } from "@/components/landing/rescue-demo";
import { Button } from "@/components/ui/button";

export function Hero() {
  const [stats, setStats] = useState<{ reported: number; rescued: number; ngos: number } | null>(null);
  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((b) => b.success && setStats(b.data))
      .catch(() => undefined);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="container grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
        <div className="max-w-xl">
          <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.25rem]">
            Hurt animal on the road? Get a rescue team there.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Send a photo and your location. The nearest verified NGO gets alerted, accepts the case, and you follow
            the animal all the way to recovery.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="destructive" className="h-14 rounded-xl px-7 text-lg font-bold shadow-[0_10px_24px_-8px_hsl(var(--destructive)/0.7)]">
              <Link href="/sos">
                <Siren className="h-5 w-5" /> Send emergency SOS
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-14 rounded-xl px-6 text-base">
              <Link href="/report">Report a non-urgent case</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">For SOS you only need your name and phone number. No account needed.</p>

          {stats && (
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t pt-6 text-sm">
              {[
                [stats.reported, "animals reported"],
                [stats.rescued, "rescued so far"],
                [stats.ngos, "verified NGOs"],
              ].map(([n, label]) => (
                <div key={label as string} className="flex items-baseline gap-2">
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-2xl font-bold tabular-nums">{n}</dd>
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </dl>
          )}
        </div>

        <RescueDemo />
      </div>
    </section>
  );
}
