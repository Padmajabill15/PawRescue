"use client";

import { FileWarning, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { EmptyState, PageHeader } from "@/components/dashboard/stat-card";
import { useRealtime } from "@/components/realtime-provider";
import { RequestCard } from "@/components/rescue/request-card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { RescueRequest } from "@/lib/requests";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "unassigned", label: "Unassigned" },
  { key: "escalated", label: "Escalated" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

type Row = RescueRequest & { escalationLevel?: number };

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const filter = (FILTERS.find((f) => f.key === params.get("filter"))?.key ?? "all") as Filter;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Row[]>(`/admin/requests?filter=${filter}`).then(setRows).catch((e: Error) => setError(e.message));
  }, [filter]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);
  useRealtime("request:new", load);
  useRealtime("request:updated", load);

  return (
    <>
      <PageHeader title="All requests" subtitle="Every rescue on the platform. Updates live." />
      <div role="tablist" className="mb-4 inline-flex flex-wrap rounded-lg border bg-muted/50 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => router.replace(`/dashboard/admin/requests?filter=${f.key}`)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm transition-colors",
              filter === f.key ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {rows === null && !error ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows?.length ? (
        <div className="grid gap-3">
          {rows.map((r) => (
            <RequestCard
              key={r._id}
              r={r}
              href={`/dashboard/admin/requests/${r._id}`}
              action={
                <span className="flex items-center gap-1.5">
                  {(r.escalationLevel ?? 0) > 0 && r.status === "submitted" && <Badge variant="danger">Escalated</Badge>}
                  <span>{r.assignedNgo?.name ?? "No NGO yet"}</span>
                </span>
              }
            />
          ))}
        </div>
      ) : (
        !error && <EmptyState icon={FileWarning} title="Nothing here" text="Requests matching this filter will show up here live." />
      )}
    </>
  );
}

export default function AdminRequestsPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
