"use client";

import { Inbox, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/dashboard/stat-card";
import { MarkersMap } from "@/components/map";
import { RequestCard } from "@/components/rescue/request-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { RescueRequest } from "@/lib/requests";

const RANK = { critical: 0, high: 1, medium: 2, low: 3 };

export default function NgoRequestsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<RescueRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api<RescueRequest[]>("/requests/nearby")
      .then((r) =>
        setRows(
          r.sort(
            (a, b) =>
              Number(b.isEmergency) - Number(a.isEmergency) ||
              RANK[a.severity] - RANK[b.severity] ||
              (a.distanceKm ?? 0) - (b.distanceKm ?? 0),
          ),
        ),
      )
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const markers = useMemo(
    () =>
      (rows ?? []).map((r) => ({
        id: r._id,
        lat: r.location.coordinates[1],
        lng: r.location.coordinates[0],
        tone: r.isEmergency || r.severity === "critical" ? ("danger" as const) : ("primary" as const),
        label: `${r.species} · ${r.distanceKm} km`,
      })),
    [rows],
  );

  async function accept(id: string) {
    setBusy(id);
    try {
      await api(`/requests/${id}/accept`, { method: "PATCH" });
      router.push(`/dashboard/ngo/cases/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't accept");
      setBusy(null);
      load();
    }
  }

  return (
    <>
      <PageHeader title="Incoming requests" subtitle="Open rescues inside your service radius. Emergencies first.">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </PageHeader>
      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}
      {rows === null && !error ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows?.length ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="grid content-start gap-3">
            {rows.map((r) => (
              <RequestCard
                key={r._id}
                r={r}
                href={`/dashboard/ngo/cases/${r._id}`}
                action={
                  <Button size="sm" onClick={() => accept(r._id)} disabled={busy !== null}>
                    {busy === r._id && <Loader2 className="h-4 w-4 animate-spin" />}
                    Accept rescue
                  </Button>
                }
              />
            ))}
          </div>
          <Card className="h-80 overflow-hidden xl:sticky xl:top-24 xl:h-[520px]">
            <MarkersMap markers={markers} />
          </Card>
        </div>
      ) : (
        !error && <EmptyState icon={Inbox} title="All quiet for now" text="New reports inside your service radius show up here automatically." />
      )}
    </>
  );
}
