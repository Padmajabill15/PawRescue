"use client";

import { AlarmClock, ClipboardList, Clock, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, StatCard } from "@/components/dashboard/stat-card";
import { useRealtime } from "@/components/realtime-provider";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface Stats {
  users: number;
  ngos: { pending: number; approved: number; rejected: number };
  requests: number;
  openRequests: number;
  unassigned: number;
  escalated: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => api<Stats>("/admin/stats").then(setStats).catch((e: Error) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  useRealtime("request:new", () => void load());
  useRealtime("request:updated", () => void load());

  const v = (n?: number) => (n === undefined ? "–" : n);

  return (
    <>
      <PageHeader title="Admin overview" subtitle="Verify NGOs and keep every rescue moving." />
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <FadeIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending NGO approvals" value={v(stats?.ngos.pending)} icon={Clock} tone="warning" />
        <StatCard label="Verified NGOs" value={v(stats?.ngos.approved)} icon={ShieldCheck} />
        <StatCard label="Registered users" value={v(stats?.users)} icon={Users} tone="accent" />
        <StatCard label="Open requests" value={v(stats?.openRequests)} icon={ClipboardList} tone="danger" />
      </FadeIn>

      {stats && stats.escalated > 0 && (
        <FadeIn className="mt-6">
          <Card className="flex flex-col gap-3 border-destructive/40 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <AlarmClock className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold">
                  {stats.escalated} rescue{stats.escalated > 1 ? "s" : ""} unattended for too long
                </p>
                <p className="text-sm text-muted-foreground">No NGO has accepted these yet. Wider-area NGOs were alerted.</p>
              </div>
            </div>
            <Button asChild variant="destructive">
              <Link href="/dashboard/admin/requests?filter=escalated">Review now</Link>
            </Button>
          </Card>
        </FadeIn>
      )}

      <FadeIn delay={0.1} className="mt-6">
        <Card>
          <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>NGO approval queue</CardTitle>
              <CardDescription>
                {stats?.ngos.pending
                  ? `${stats.ngos.pending} application${stats.ngos.pending > 1 ? "s" : ""} waiting for review.`
                  : "No applications waiting right now."}
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboard/admin/ngos">Review applications</Link>
            </Button>
          </CardHeader>
          <CardContent />
        </Card>
      </FadeIn>
    </>
  );
}
