"use client";

import { Check, Loader2, Mail, MapPin, Phone, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EmptyState, PageHeader } from "@/components/dashboard/stat-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected";

interface NgoRow {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  description?: string;
  registrationNumber?: string;
  verificationStatus: Status;
  rejectionReason?: string;
  serviceRadiusKm: number;
  capacity: number;
  specializations: string[];
  location: { coordinates: [number, number] };
  createdAt: string;
}

const TABS: Status[] = ["pending", "approved", "rejected"];
const BADGE = { pending: "warning", approved: "success", rejected: "danger" } as const;

export default function AdminNgosPage() {
  const [tab, setTab] = useState<Status>("pending");
  const [rows, setRows] = useState<NgoRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      setRows(await api<NgoRow[]>(`/admin/ngos?status=${tab}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      await api(`/admin/ngos/${id}/status`, {
        method: "PATCH",
        json: { status, reason: status === "rejected" ? reason || undefined : undefined },
      });
      setRows((r) => r?.filter((n) => n._id !== id) ?? null);
      setRejecting(null);
      setReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="NGO approvals" subtitle="Only approved NGOs can sign in and receive rescue requests." />

      <div role="tablist" className="mb-4 inline-flex rounded-lg border bg-muted/50 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm capitalize transition-colors",
              tab === t ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {rows === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title={`No ${tab} NGOs`} text="New applications from /ngo/apply show up under Pending." />
      ) : (
        <div className="grid gap-4">
          {rows.map((n) => (
            <Card key={n._id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{n.name}</h3>
                    <Badge variant={BADGE[n.verificationStatus]} className="capitalize">
                      {n.verificationStatus}
                    </Badge>
                    {n.registrationNumber && <Badge variant="muted">Reg. {n.registrationNumber}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {n.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {n.phone}
                    </span>
                    <a
                      className="flex items-center gap-1.5 hover:text-primary"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.openstreetmap.org/?mlat=${n.location.coordinates[1]}&mlon=${n.location.coordinates[0]}#map=14/${n.location.coordinates[1]}/${n.location.coordinates[0]}`}
                    >
                      <MapPin className="h-3.5 w-3.5" /> {n.address || "View on map"}
                    </a>
                  </div>
                  {n.description && <p className="text-sm">{n.description}</p>}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Badge variant="muted">{n.serviceRadiusKm} km radius</Badge>
                    <Badge variant="muted">Capacity {n.capacity}</Badge>
                    {n.specializations.map((s) => (
                      <Badge key={s} className="capitalize">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  {n.rejectionReason && (
                    <p className="text-sm text-destructive">Reason: {n.rejectionReason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Applied {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {n.verificationStatus !== "approved" && rejecting !== n._id && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => review(n._id, "approved")} disabled={busyId === n._id}>
                      {busyId === n._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Approve
                    </Button>
                    {n.verificationStatus === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => setRejecting(n._id)}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    )}
                  </div>
                )}
                {n.verificationStatus === "approved" && (
                  <Button size="sm" variant="outline" className="shrink-0" onClick={() => setRejecting(n._id)}>
                    Revoke
                  </Button>
                )}
              </div>

              {rejecting === n._id && (
                <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row">
                  <Input
                    autoFocus
                    placeholder="Reason (shown to the NGO when they try to sign in)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-10"
                      disabled={busyId === n._id}
                      onClick={() => review(n._id, "rejected")}
                    >
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" className="h-10" onClick={() => setRejecting(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
