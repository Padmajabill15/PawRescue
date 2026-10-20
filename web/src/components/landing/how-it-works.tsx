import { Camera, HeartPulse, MapPin } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

const steps = [
  {
    icon: Camera,
    title: "Report",
    text: "Snap a photo, add your GPS location and a short description. No full registration in an emergency.",
  },
  {
    icon: MapPin,
    title: "Nearest NGO accepts",
    text: "Verified NGOs close to the animal are alerted and one accepts the rescue.",
  },
  {
    icon: HeartPulse,
    title: "Rescue & recovery",
    text: "Follow live status updates with photos from rescue through treatment to recovery.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 py-16 sm:py-20">
      <div className="container">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three simple steps from spotting an animal to seeing it recover.</p>
        </FadeIn>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.1}>
              <div className="h-full rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <span className="text-3xl font-bold text-muted-foreground/40">{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
