"use client";

import { ClipboardList, HeartHandshake, PawPrint, PlusCircle, Siren } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, PageHeader, StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/motion/fade-in";
import { RequestCard } from "@/components/rescue/request-card";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { RescueRequest } from "@/lib/requests";

export default function UserDashboard() {
  const { user } = useSession();
  const first = user?.name.split(" ")[0] ?? "there";
  const [rows, setRows] = useState<RescueRequest[] | null>(null);

  useEffect(() => {
    api<RescueRequest[]>("/requests/mine").then(setRows).catch(() => setRows([]));
  }, []);

  const rescued = rows?.filter((r) => ["rescued", "treatment", "recovered", "closed"].includes(r.status)).length;
  const ngos = rows ? new Set(rows.map((r) => r.assignedNgo?._id).filter(Boolean)).size : undefined;
  const v = (n?: number) => (n === undefined ? "–" : n);

  return (
    <>
      <PageHeader title={`Hi ${first} 👋`} subtitle="Thanks for looking out for animals in your area.">
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/user/report">
              <PlusCircle className="h-4 w-4" /> Report
            </Link>
          </Button>
          <Button asChild variant="destructive">
            <Link href="/sos">
              <Siren className="h-4 w-4" /> SOS
            </Link>
          </Button>
        </div>
      </PageHeader>

      <FadeIn className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Reports filed" value={v(rows?.length)} icon={ClipboardList} />
        <StatCard label="Animals rescued" value={v(rescued)} icon={PawPrint} tone="accent" />
        <StatCard label="NGOs that helped" value={v(ngos)} icon={HeartHandshake} tone="warning" />
      </FadeIn>

      <FadeIn delay={0.1} className="mt-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent reports</CardTitle>
            {rows && rows.length > 3 && (
              <Link href="/dashboard/user/reports" className="text-sm text-primary hover:underline">
                View all
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {rows?.length ? (
              <div className="grid gap-3">
                {rows.slice(0, 3).map((r) => (
                  <RequestCard key={r._id} r={r} href={`/dashboard/user/reports/${r._id}`} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={PawPrint}
                title={rows ? "No reports yet" : "Loading…"}
                text="When you report an injured animal, you'll track its rescue and recovery here, step by step."
              />
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </>
  );
}
