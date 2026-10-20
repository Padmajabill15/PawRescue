"use client";

import { ArrowLeft, Building2, Loader2, MapPin, Phone, Siren } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MarkersMap } from "@/components/map";
import { HistoryList, StatusStepper } from "@/components/rescue/status-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { SEVERITY_BADGE, SPECIES_EMOJI, STATUS_LABEL, timeAgo, type RequestDetail } from "@/lib/requests";

export function useRequest(id: string) {
  const [data, setData] = useState<RequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    api<RequestDetail>(`/requests/${id}`).then(setData).catch((e: Error) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);
  return { data, error, reload: load };
}

export function RequestDetailView({
  data,
  error,
  backHref,
  backLabel,
  banner,
  actions,
  showReporter = false,
}: {
  data: RequestDetail | null;
  error: string | null;
  backHref: string;
  backLabel: string;
  banner?: ReactNode;
  actions?: ReactNode;
  showReporter?: boolean;
}) {
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const [lng, lat] = data.location.coordinates;
  const ngo = data.assignedNgo;
  const reporter = typeof data.reporter === "object" ? data.reporter : null;

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Link>

      {banner}

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold capitalize sm:text-3xl">
          {SPECIES_EMOJI[data.species]} {data.species} rescue
        </h1>
        {data.isEmergency && (
          <Badge variant="danger" className="gap-1">
            <Siren className="h-3 w-3" /> SOS
          </Badge>
        )}
        <Badge variant={SEVERITY_BADGE[data.severity]} className="capitalize">
          {data.severity} severity
        </Badge>
        <span className="text-sm text-muted-foreground">Reported {timeAgo(data.createdAt)}</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <StatusStepper status={data.status} />
        </CardContent>
      </Card>

      {actions}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.description && <p>{data.description}</p>}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.images.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Treatment updates</CardTitle>
            </CardHeader>
            <CardContent>
              {data.updates.length ? (
                <ul className="space-y-5">
                  {data.updates.map((u) => (
                    <li key={u._id} className="space-y-2 border-b pb-5 last:border-0 last:pb-0">
                      <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleString()}</p>
                      <p className="whitespace-pre-line text-sm">{u.notes}</p>
                      {u.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {u.images.map((src) => (
                            <a key={src} href={src} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" className="aspect-square w-full rounded-md object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The NGO&apos;s treatment notes and photos will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-56">
              <MarkersMap
                markers={[
                  { id: "animal", lat, lng, tone: "danger", label: "Animal location" },
                  ...(ngo?.location
                    ? [{ id: "ngo", lat: ngo.location.coordinates[1], lng: ngo.location.coordinates[0], tone: "ngo" as const, label: ngo.name }]
                    : []),
                ]}
              />
            </div>
            <CardContent className="space-y-2 pt-4 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="[overflow-wrap:anywhere]">{data.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}</span>
              </p>
              <a
                className="text-primary hover:underline"
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions →
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> {ngo ? ngo.name : "Waiting for an NGO"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {ngo ? (
                ngo.phone && (
                  <a href={`tel:${ngo.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Phone className="h-4 w-4" /> {ngo.phone}
                  </a>
                )
              ) : (
                <p className="text-muted-foreground">
                  {data.nearbyNgoCount
                    ? `${data.nearbyNgoCount} verified NGO${data.nearbyNgoCount > 1 ? "s" : ""} nearby can see this request.`
                    : "No verified NGO covers this spot yet. Our admins have been flagged."}
                </p>
              )}
              {showReporter && reporter && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs uppercase text-muted-foreground">Reported by</p>
                  <p className="font-medium">{reporter.name}</p>
                  {(data.contactPhone || reporter.phone) && (
                    <a href={`tel:${data.contactPhone || reporter.phone}`} className="flex items-center gap-2 text-primary hover:underline">
                      <Phone className="h-4 w-4" /> {data.contactPhone || reporter.phone}
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline · {STATUS_LABEL[data.status]}</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryList history={data.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
