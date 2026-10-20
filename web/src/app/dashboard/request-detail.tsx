"use client";

import { ArrowLeft, Building2, Copy, Loader2, MapPin, Phone, Siren, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MarkersMap } from "@/components/map";
import { useRealtime } from "@/components/realtime-provider";
import { HistoryList, StatusStepper } from "@/components/rescue/status-timeline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { SEVERITY_BADGE, SPECIES_EMOJI, STATUS_LABEL, timeAgo, type RequestDetail } from "@/lib/requests";
import { cn } from "@/lib/utils";

export function useRequest(id: string) {
  const [data, setData] = useState<RequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    api<RequestDetail>(`/requests/${id}`).then(setData).catch((e: Error) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);
  const onEvent = (p: { id: string }) => p.id === id && load();
  useRealtime("request:updated", onEvent);
  useRealtime("request:taken", onEvent);
  return { data, error, reload: load };
}

const SEVERITY_BAR = { low: "bg-muted-foreground/50", medium: "bg-primary", high: "bg-amber-500", critical: "bg-destructive" } as const;

function AiCard({ data }: { data: RequestDetail }) {
  const ai = data.ai;
  if (!ai) return null;
  const pct = (n?: number) => (n === undefined ? "–" : `${Math.round(n * 100)}%`);
  const speciesMismatch = ai.species && ai.species !== data.species && (ai.speciesConfidence ?? 0) >= 0.6;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> AI triage
          <Badge variant="muted" className="ml-auto font-normal">
            {ai.source === "model" ? "CLIP vision + text" : "Keyword rules (AI offline)"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {ai.severityScore !== undefined && (
          <div>
            <div className="mb-1 flex justify-between">
              <span className="text-muted-foreground">Severity score</span>
              <span className="font-semibold capitalize">
                {ai.severityScore}/100 · {data.severity}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", SEVERITY_BAR[data.severity])} style={{ width: `${ai.severityScore}%` }} />
            </div>
          </div>
        )}
        {ai.source === "model" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Species in photo</p>
              <p className="font-medium capitalize">
                {ai.species ? `${SPECIES_EMOJI[ai.species] ?? ""} ${ai.species}` : "–"} <span className="text-muted-foreground">{pct(ai.speciesConfidence)}</span>
              </p>
            </div>
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Looks injured</p>
              <p className="font-medium">{pct(ai.injuryProbability)}</p>
            </div>
          </div>
        )}
        {speciesMismatch && (
          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            Reporter chose &ldquo;{data.species}&rdquo; but the photo looks like a {ai.species}.
          </p>
        )}
        {ai.reasons && ai.reasons.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {ai.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">A suggestion to help prioritise. The NGO&apos;s assessment always comes first.</p>
      </CardContent>
    </Card>
  );
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

      {data.duplicateOf && typeof data.duplicateOf === "object" && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <Copy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium">This animal was already reported{data.duplicateScore ? ` (photo match ${Math.round(data.duplicateScore * 100)}%)` : ""}.</p>
            <p className="text-muted-foreground">
              We linked your report to the existing case, so no second rescue team is sent. Current status:{" "}
              <span className="font-medium text-foreground">{STATUS_LABEL[data.duplicateOf.status]}</span>
              {data.duplicateOf.assignedNgo ? ` · handled by ${data.duplicateOf.assignedNgo.name}` : " · waiting for an NGO"}. You&apos;ll get its updates.
            </p>
          </div>
        </div>
      )}

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
          <AiCard data={data} />
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
