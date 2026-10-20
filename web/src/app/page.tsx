import { AiSection, NgoBand } from "@/components/landing/ai-and-ngos";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LiveMap } from "@/components/landing/live-map";
import { PhotoBand } from "@/components/landing/photo-band";
import { CareSection } from "@/components/landing/vet-care";

/** The landing page is "night rescue" themed (dark); the app itself follows the user's theme. */
export default function Home() {
  return (
    <div className="dark bg-background text-foreground">
      <Hero />
      <PhotoBand />
      <HowItWorks />
      <LiveMap />
      <CareSection />
      <AiSection />
      <NgoBand />
    </div>
  );
}
