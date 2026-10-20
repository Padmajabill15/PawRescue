"use client";

import { ClipboardList, Clock, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader, StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

interface Stats {
  users: number;
  ngos: { pending: number; approved: number; rejected: number };
  requests: number;
  openRequests: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Stats>("/admin/stats").then(setStats).catch((e: Error) => setError(e.message));
  }, []);

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
