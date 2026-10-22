"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { PageHeader } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Sheet = "users" | "ngos" | "requests";
type Row = Record<string, unknown> & { id: string };

const date = (v: unknown) => (v ? new Date(String(v)).toLocaleDateString() : "");
const tel = (v: unknown) => (v ? <a className="text-primary hover:underline" href={`tel:${v}`}>{String(v)}</a> : "");
const mail = (v: unknown) => (v ? <a className="text-primary hover:underline" href={`mailto:${v}`}>{String(v)}</a> : "");

const COLUMNS: Record<Sheet, Column<Row>[]> = {
  users: [
    { key: "name", label: "Name" },
    { key: "email", label: "Email", render: (r) => mail(r.email) },
    { key: "phone", label: "Phone", render: (r) => tel(r.phone) },
    { key: "role", label: "Role", render: (r) => <Badge variant={r.role === "ngo" ? "default" : r.role === "admin" ? "warning" : "muted"}>{r.role === "user" ? "Reporter" : String(r.role).toUpperCase()}</Badge> },
    { key: "signIn", label: "Signs in with" },
    { key: "ngo", label: "NGO" },
    { key: "reports", label: "Reports", align: "right" },
    { key: "deletionRequested", label: "Deletion asked", render: (r) => (r.deletionRequested ? <Badge variant="danger">Yes</Badge> : "") },
    { key: "joined", label: "Joined", render: (r) => date(r.joined) },
  ],
  ngos: [
    { key: "name", label: "NGO" },
    { key: "status", label: "Status", render: (r) => <Badge variant={r.status === "approved" ? "success" : r.status === "pending" ? "warning" : "danger"}>{String(r.status)}</Badge> },
    { key: "email", label: "Email", render: (r) => mail(r.email) },
    { key: "phone", label: "Phone", render: (r) => tel(r.phone) },
    { key: "address", label: "Address" },
    { key: "registrationNumber", label: "Reg. no." },
    { key: "serviceRadiusKm", label: "Radius km", align: "right" },
    { key: "capacity", label: "Capacity", align: "right" },
    { key: "specializations", label: "Treats" },
    { key: "casesAccepted", label: "Cases", align: "right" },
    { key: "recovered", label: "Recovered", align: "right" },
    { key: "sosHandled", label: "SOS", align: "right" },
    { key: "joined", label: "Joined", render: (r) => date(r.joined) },
  ],
  requests: [
    { key: "created", label: "Reported", render: (r) => <Link className="text-primary hover:underline" href={`/dashboard/admin/requests/${r.id}`}>{new Date(String(r.created)).toLocaleString()}</Link> },
    { key: "species", label: "Animal" },
    { key: "severity", label: "Severity" },
    { key: "aiScore", label: "AI score", align: "right" },
    { key: "status", label: "Status" },
    { key: "sos", label: "SOS", render: (r) => (r.sos ? <Badge variant="danger">SOS</Badge> : "") },
    { key: "reporter", label: "Reporter" },
    { key: "reporterPhone", label: "Reporter phone", render: (r) => tel(r.reporterPhone) },
    { key: "reporterEmail", label: "Reporter email", render: (r) => mail(r.reporterEmail) },
    { key: "ngo", label: "NGO" },
    { key: "ngoPhone", label: "NGO phone", render: (r) => tel(r.ngoPhone) },
    { key: "address", label: "Landmark" },
    { key: "duplicate", label: "Duplicate", render: (r) => (r.duplicate ? "Yes" : "") },
  ],
};

const TABS: { key: Sheet; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "ngos", label: "NGOs" },
  { key: "requests", label: "Rescue requests" },
];

export default function DataSheetsPage() {
  const [tab, setTab] = useState<Sheet>("users");
  const [demo, setDemo] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    setError(null);
    api<Row[]>(`/admin/data/${tab}?demo=${demo}`).then(setRows).catch((e: Error) => setError(e.message));
  }, [tab, demo]);

  return (
    <>
      <PageHeader title="Data sheets" subtitle="Every account, NGO and rescue in one place. Search, sort and download as CSV (opens in Excel)." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex rounded-lg border bg-muted/50 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn("rounded-md px-4 py-1.5 text-sm", tab === t.key ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
          <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="accent-[hsl(var(--primary))]" />
          Include demo data
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!rows && !error ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        rows && <DataTable key={tab} rows={rows} columns={COLUMNS[tab]} filename={`pawrescue-${tab}`} />
      )}
    </>
  );
}
