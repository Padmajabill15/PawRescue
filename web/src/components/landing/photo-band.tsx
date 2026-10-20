"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Free-licence photos (Unsplash). Any that fail to load are simply skipped.
const PHOTOS = [
  { id: "photo-1548199973-03cce0bbc87b", alt: "Two dogs running across a field" },
  { id: "photo-1514888286974-6c03e2ca1dba", alt: "Close-up of a cat's face" },
  { id: "photo-1543466835-00a7907e9de1", alt: "A dog looking up at the camera" },
  { id: "photo-1452570053594-1b985d6ea890", alt: "An owl perched in daylight" },
  { id: "photo-1583337130417-3346a1be7dee", alt: "A dog resting outdoors" },
];

export function PhotoBand() {
  const [failed, setFailed] = useState<string[]>([]);
  const shown = PHOTOS.filter((p) => !failed.includes(p.id));
  if (shown.length < 3) return null;

  return (
    <section aria-label="Animals" className="container pb-16">
      <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[200px] md:grid-cols-4">
        {shown.slice(0, 5).map((p, i) => (
          <figure key={p.id} className={cn("overflow-hidden rounded-xl bg-muted", i === 0 && "row-span-2 md:col-span-2")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://images.unsplash.com/${p.id}?auto=format&fit=crop&w=900&q=70`}
              alt={p.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              onError={() => setFailed((f) => [...f, p.id])}
            />
          </figure>
        ))}
      </div>
      <p className="mt-3 text-right text-xs text-muted-foreground">Photos: Unsplash</p>
    </section>
  );
}
