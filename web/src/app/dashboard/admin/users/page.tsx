"use client";

import { Check, Loader2, Trash2, Users, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { EmptyState, PageHeader } from "@/components/dashboard/stat-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "Everyone" },
  { key: "user", label: "Reporters" },
  { key: "ngo", label: "NGOs" },
  { key: "deletion", label: "Deletion requests" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

interface Row {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: "user" | "ngo" | "admin";
  authProvider: string;
  isEmergencyUser?: boolean;
  deletionRequest?: { requestedAt: string; reason?: string };
  createdAt: string;
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const filter = (FILTERS.find((f) => f.key === params.get("filter"))?.key ?? "all") as Filter;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(null);
    api<Row[]>(`/admin/users?filter=${filter}`).then(setRows).catch((e: Error) => setError(e.message));
  }, [filter]);
  useEffect(load, [load]);

  async function decide(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError(null);
    try {
      await api(`/admin/users/${id}/deletion`, { method: "POST", json: { action } });
      setConfirming(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader title="Users" subtitle="Reporters and NGO accounts. Deletion requests need your approval." />
      <div role="tablist" className="mb-4 inline-flex flex-wrap rounded-lg border bg-muted/50 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => router.replace(`/dashboard/admin/users?filter=${f.key}`)}
            className={cn("rounded-md px-4 py-1.5 text-sm", filter === f.key ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {rows === null ? (
        !error && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="Nobody here" text={filter === "deletion" ? "No one has asked to delete their account." : "No accounts match this filter."} />
      ) : (
        <Card className="divide-y">
          {rows.map((u) => (
            <div key={u._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {u.name}
                  <Badge variant={u.role === "ngo" ? "default" : u.role === "admin" ? "warning" : "muted"}>{u.role === "user" ? "Reporter" : u.role === "ngo" ? "NGO" : "Admin"}</Badge>
                  {u.authProvider === "guest" && <Badge variant="muted">Quick SOS</Badge>}
                  {u.deletionRequest && <Badge variant="danger">Wants deletion</Badge>}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {[u.email, u.phone].filter(Boolean).join(", ") || "No contact details"} · joined {new Date(u.createdAt).toLocaleDateString()}
                </p>
                {u.deletionRequest?.reason && <p className="mt-1 text-sm">Reason: {u.deletionRequest.reason}</p>}
              </div>
              {u.deletionRequest && (
                <div className="flex shrink-0 gap-2">
                  {confirming === u._id ? (
                    <>
                      <Button size="sm" variant="destructive" onClick={() => decide(u._id, "approve")} disabled={busy !== null}>
                        {busy === u._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Yes, delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="destructive" onClick={() => setConfirming(u._id)}>
                        <Check className="h-4 w-4" /> Approve deletion
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => decide(u._id, "reject")} disabled={busy !== null}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
