"use client";

import { ClipboardList, HeartHandshake, PawPrint, Siren } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader, StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/motion/fade-in";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserDashboard() {
  const { user } = useSession();
  const first = user?.name.split(" ")[0] ?? "there";

  return (
    <>
      <PageHeader title={`Hi ${first} 👋`} subtitle="Thanks for looking out for animals in your area.">
        <Button asChild variant="destructive">
          <Link href="/sos">
            <Siren className="h-4 w-4" /> Emergency SOS
          </Link>
        </Button>
      </PageHeader>

      <FadeIn className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Reports filed" value={0} icon={ClipboardList} />
        <StatCard label="Animals rescued" value={0} icon={PawPrint} tone="accent" />
        <StatCard label="NGOs helped" value={0} icon={HeartHandshake} tone="warning" />
      </FadeIn>

      <FadeIn delay={0.1} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>My reports</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={PawPrint}
              title="No reports yet"
              text="When you report an injured animal, you'll track its rescue and recovery here, step by step."
            />
          </CardContent>
        </Card>
      </FadeIn>
    </>
  );
}
