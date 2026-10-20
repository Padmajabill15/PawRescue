import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const REASONS = ["Description mentions “hit by a bike”", "Photo looks injured (82%)", "Reporter marked it as an emergency"];

export function AiSection() {
  return (
    <section className="container grid items-center gap-12 py-20 lg:grid-cols-2">
      <div className="max-w-lg">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">AI decides who needs help first, and says why</h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Every report gets a severity score from the photo and the description. NGOs see the reasons, not just a label,
          and always make the final call. If five people report the same dog, the reports are merged so only one team goes.
        </p>
      </div>
      <figure className="rounded-2xl border bg-card p-6 sm:p-8">
        <figcaption className="flex items-baseline justify-between">
          <span className="font-semibold">Severity</span>
          <span className="font-display text-3xl font-extrabold tabular-nums">
            86<span className="text-base font-medium text-muted-foreground">/100</span>
          </span>
        </figcaption>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[86%] rounded-full bg-destructive" />
        </div>
        <ul className="mt-6 space-y-2.5 text-sm">
          {REASONS.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">Species detected: dog, 95% confidence</p>
      </figure>
    </section>
  );
}

export function NgoBand() {
  return (
    <section id="for-ngos" className="bg-primary text-primary-foreground">
      <div className="container flex flex-col gap-8 py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Run a shelter or a rescue team?</h2>
          <p className="mt-3 text-primary-foreground/85">
            Get nearby cases on a live map, sorted by urgency. Every NGO is checked by our team before it can accept rescues.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <Button asChild size="lg" className="h-13 rounded-xl bg-card px-7 text-base font-bold text-foreground hover:bg-card/90">
            <Link href="/ngo/apply">Apply as an NGO</Link>
          </Button>
          <span className="flex items-center gap-1.5 text-sm text-primary-foreground/80">
            <ShieldCheck className="h-4 w-4" /> Free for registered NGOs
          </span>
        </div>
      </div>
    </section>
  );
}
