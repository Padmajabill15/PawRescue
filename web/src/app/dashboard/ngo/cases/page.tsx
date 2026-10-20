"use client";

import { HeartPulse, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, PageHeader } from "@/components/dashboard/stat-card";
import { RequestCard } from "@/components/rescue/request-card";
import { api } from "@/lib/api";
import type { RescueRequest } from "@/lib/requests";
import { cn } from "@/lib/utils";

export default function NgoCasesPage() {
  const [rows, setRows] = useState<RescueRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "done">("active");

  useEffect(() => {
    api<RescueRequest[]>("/requests/cases").then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  const done = (r: RescueRequest) => r.status === "recovered" || r.status === "closed";
  const shown = rows?.filter((r) => (tab === "done" ? done(r) : !done(r)));

  return (
    <>
      <PageHeader title="My cases" subtitle="Rescues your team has accepted." />
      <div role="tablist" className="mb-4 inline-flex rounded-lg border bg-muted/50 p-1">
        {(["active", "done"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm transition-colors",
              tab === t ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "active" ? "Active" : "Recovered & closed"}
            {rows && <span className="ml-1.5 text-xs text-muted-foreground">{rows.filter((r) => (t === "done" ? done(r) : !done(r))).length}</span>}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {rows === null && !error ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : shown?.length ? (
        <div className="grid gap-3">
          {shown.map((r) => (
            <RequestCard key={r._id} r={r} href={`/dashboard/ngo/cases/${r._id}`} />
          ))}
        </div>
      ) : (
        !error && <EmptyState icon={HeartPulse} title="No cases here" text="Accept a request from Incoming requests to start a case." />
      )}
    </>
  );
}
