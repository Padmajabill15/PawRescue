import { Camera, HeartPulse, MapPinned, Truck } from "lucide-react";

const STOPS = [
  { icon: Camera, title: "You report", text: "Snap a photo. Your location is filled in, and AI recognises the animal and how badly it's hurt." },
  { icon: MapPinned, title: "NGOs are alerted", text: "Verified NGOs whose area covers the spot get an alert. Emergencies go to the top of their list." },
  { icon: Truck, title: "A team comes", text: "One NGO accepts, so no one is sent twice. You see when they're on the way." },
  { icon: HeartPulse, title: "You see recovery", text: "Treatment notes and photos arrive on your report until the animal is healthy again." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y bg-card">
      <div className="container py-20">
        <h2 className="max-w-lg font-display text-3xl font-bold sm:text-4xl">From the roadside to recovery, in four stops</h2>

        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          {/* the route line joining the stops */}
          <span aria-hidden className="absolute left-5 top-5 hidden h-0 w-[calc(100%-2.5rem)] border-t-2 border-dashed border-primary/40 md:block" />
          <span aria-hidden className="absolute bottom-5 left-5 top-5 w-0 border-l-2 border-dashed border-primary/40 md:hidden" />
          {STOPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative flex gap-4 md:block">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground ring-8 ring-card">
                {i + 1}
              </span>
              <div className="md:mt-5">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                  <Icon className="h-4 w-4 text-primary" /> {title}
                </h3>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
