import { AiSection, NgoBand } from "@/components/landing/ai-and-ngos";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PhotoBand } from "@/components/landing/photo-band";
import { CareSection } from "@/components/landing/vet-care";
import { Dashboards3D } from "@/components/landing/dashboards-3d";

export default function Home() {
  return (
    <>
      <Hero />
      <PhotoBand />
      <HowItWorks />
      <CareSection />
      <Dashboards3D />
      <AiSection />
      <NgoBand />
    </>
  );
}
