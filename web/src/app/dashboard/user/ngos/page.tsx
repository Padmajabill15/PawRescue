"use client";

import { Building2, Loader2, Mail, MapPin, Phone, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, PageHeader } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface Ngo {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  description?: string;
  specializations: string[];
  serviceRadiusKm: number;
  location: { coordinates: [number, number] };
}

export default function NgoDirectoryPage() {
  const [rows, setRows] = useState<Ngo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<Ngo[]>("/ngos/directory").then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => !n || [r.name, r.address, r.specializations.join(" ")].join(" ").toLowerCase().includes(n));
  }, [rows, q]);

  return (
    <>
      <PageHeader title="Verified NGOs" subtitle="Rescue teams checked by our admins. Call them directly if you need to." />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, area or animal" className="pl-9" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!rows && !error ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : shown.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((n) => (
            <Card key={n._id} className="space-y-3 p-5">
              <h3 className="font-display text-lg font-bold">{n.name}</h3>
              {n.description && <p className="line-clamp-2 text-sm text-muted-foreground">{n.description}</p>}
              <div className="space-y-1.5 text-sm">
                <a href={`tel:${n.phone}`} className="flex items-center gap-2 text-primary hover:underline"><Phone className="h-4 w-4" /> {n.phone}</a>
                <a href={`mailto:${n.email}`} className="flex items-center gap-2 text-primary hover:underline"><Mail className="h-4 w-4" /> {n.email}</a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${n.location.coordinates[1]},${n.location.coordinates[0]}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 text-muted-foreground hover:text-foreground"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> <span className="[overflow-wrap:anywhere]">{n.address || "Open in Maps"}</span>
                </a>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="muted">Covers {n.serviceRadiusKm} km</Badge>
                {n.specializations.map((s) => <Badge key={s} className="capitalize">{s}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        !error && <EmptyState icon={Building2} title="No NGOs found" text="Try a different search." />
      )}
    </>
  );
}
