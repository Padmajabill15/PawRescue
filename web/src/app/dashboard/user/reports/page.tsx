"use client";

import { ClipboardList, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, PageHeader } from "@/components/dashboard/stat-card";
import { RequestCard } from "@/components/rescue/request-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { RescueRequest } from "@/lib/requests";

export default function MyReportsPage() {
  const [rows, setRows] = useState<RescueRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<RescueRequest[]>("/requests/mine").then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader title="My reports" subtitle="Follow every animal you reported, from rescue to recovery.">
        <Button asChild>
          <Link href="/dashboard/user/report">
            <PlusCircle className="h-4 w-4" /> New report
          </Link>
        </Button>
      </PageHeader>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {rows === null && !error ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows?.length ? (
        <div className="grid gap-3">
          {rows.map((r) => (
            <RequestCard key={r._id} r={r} href={`/dashboard/user/reports/${r._id}`} />
          ))}
        </div>
      ) : (
        !error && <EmptyState icon={ClipboardList} title="No reports yet" text="Spotted an animal that needs help? Report it and track the rescue here." />
      )}
    </>
  );
}
