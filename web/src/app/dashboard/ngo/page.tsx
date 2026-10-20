"use client";

import { BedDouble, HeartPulse, Inbox, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, PageHeader, StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { RequestCard } from "@/components/rescue/request-card";
import { useRealtime } from "@/components/realtime-provider";
import type { RescueRequest } from "@/lib/requests";

interface NgoProfile {
  name: string;
  email: string;
  phone: string;
  address?: string;
  verificationStatus: string;
  serviceRadiusKm: number;
  specializations: string[];
  capacity: number;
  rating: number;
  location: { coordinates: [number, number] };
}

export default function NgoDashboard() {
  const [ngo, setNgo] = useState<NgoProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nearby, setNearby] = useState<RescueRequest[] | null>(null);
  const [cases, setCases] = useState<RescueRequest[] | null>(null);

  useEffect(() => {
    api<NgoProfile>("/ngos/me").then(setNgo).catch((e: Error) => setError(e.message));
    api<RescueRequest[]>("/requests/nearby").then(setNearby).catch(() => setNearby([]));
    api<RescueRequest[]>("/requests/cases").then(setCases).catch(() => setCases([]));
  }, []);

  const reloadNearby = () => void api<RescueRequest[]>("/requests/nearby").then(setNearby).catch(() => undefined);
  useRealtime("request:new", reloadNearby);
  useRealtime("request:taken", reloadNearby);

  const active = cases?.filter((c) => !["recovered", "closed"].includes(c.status)).length;

  return (
    <>
      <PageHeader title={ngo?.name ?? "NGO dashboard"} subtitle="Nearby rescue requests and your active cases.">
        {ngo && <Badge variant="success">Verified NGO</Badge>}
      </PageHeader>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <FadeIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="New requests" value={nearby?.length ?? "–"} icon={Inbox} tone="danger" />
        <StatCard label="Active cases" value={active ?? "–"} icon={HeartPulse} />
        <StatCard label="Capacity" value={ngo?.capacity ?? "–"} icon={BedDouble} tone="accent" />
        <StatCard label="Rating" value={ngo ? ngo.rating.toFixed(1) : "–"} icon={Star} tone="warning" />
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Incoming requests</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/ngo/requests">Open map</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {nearby?.length ? (
                <div className="grid gap-3">
                  {nearby.slice(0, 3).map((r) => (
                    <RequestCard key={r._id} r={r} href={`/dashboard/ngo/cases/${r._id}`} />
                  ))}
                </div>
              ) : (
              <EmptyState
                icon={Inbox}
                title="All quiet for now"
                text="Rescue requests within your service radius will appear here with distance and severity."
              />
              )}
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.15}>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {ngo ? (
                <>
                  <p className="flex items-start gap-2 break-words text-muted-foreground [overflow-wrap:anywhere]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {ngo.address || `${ngo.location.coordinates[1]}, ${ngo.location.coordinates[0]}`}
                  </p>
                  <p>
                    Service radius: <span className="font-medium">{ngo.serviceRadiusKm} km</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ngo.specializations.length ? (
                      ngo.specializations.map((s) => (
                        <Badge key={s} variant="muted" className="capitalize">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No specializations set</span>
                    )}
                  </div>
                </>
              ) : (
                !error && <p className="text-muted-foreground">Loading…</p>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </>
  );
}
