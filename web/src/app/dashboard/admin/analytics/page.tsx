"use client";

import { AlertTriangle, CheckCircle2, Clock, Copy, Database, Download, HeartPulse, Info, Lightbulb, Loader2, PawPrint, Siren, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, StatCard } from "@/components/dashboard/stat-card";
import { PointsMap } from "@/components/map";
import { useRealtime } from "@/components/realtime-provider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { STATUS_LABEL, type RequestStatus } from "@/lib/requests";
import { cn } from "@/lib/utils";

const TrendChart = dynamic(() => import("./charts").then((m) => m.TrendChart), { ssr: false });
const SpeciesChart = dynamic(() => import("./charts").then((m) => m.SpeciesChart), { ssr: false });
const SeverityChart = dynamic(() => import("./charts").then((m) => m.SeverityChart), { ssr: false });
const WeekHeatmap = dynamic(() => import("./charts").then((m) => m.WeekHeatmap), { ssr: false });

interface Analytics {
  range: { days: number; includeDemo: boolean };
  kpis: {
    total: number;
    previousTotal: number;
    changePct: number | null;
    sos: number;
    duplicates: number;
    rescued: number;
    resolved: number;
    rescueRate: number;
    unassigned: number;
    escalated: number;
    medianAcceptMin: number | null;
    medianAcceptSosMin: number | null;
    medianRescueMin: number | null;
    avgSeverityScore: number | null;
    aiSpeciesMismatches: number;
  };
  trend: { date: string; reported: number; resolved: number }[];
  species: { species: string; count: number }[];
  severity: { severity: string; count: number }[];
  heatmap: number[][];
  points: { id: string; lat: number; lng: number; severity: string; species: string; status: RequestStatus; sos: boolean }[];
  leaderboard: { ngoId: string; name: string; accepted: number; rescued: number; recovered: number; sos: number; rescueRate: number; medianAcceptMin: number | null }[];
  insights: { tone: "good" | "warn" | "info"; text: string }[];
  demoCount: number;
}

const RANGES = [7, 30, 90] as const;
const SEV_VAR: Record<string, string> = { critical: "--sev-critical", high: "--sev-high", medium: "--sev-medium", low: "--sev-low" };
const fmtMin = (m: number | null) => (m === null ? "–" : m >= 90 ? `${Math.round((m / 60) * 10) / 10} h` : `${Math.round(m)} min`);

export default function AnalyticsPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [demo, setDemo] = useState(true);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"seed" | "purge" | null>(null);
  const [sevColors, setSevColors] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setError(null);
    api<Analytics>(`/admin/analytics?days=${days}&demo=${demo}`).then(setData).catch((e: Error) => setError(e.message));
  }, [days, demo]);

  useEffect(load, [load]);
  useRealtime("request:new", load);
  useRealtime("request:updated", load);

  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    setSevColors(Object.fromEntries(Object.entries(SEV_VAR).map(([k, v]) => [k, cs.getPropertyValue(v).trim() || "#888"])));
  }, [data]);

  async function demoAction(action: "seed" | "purge") {
    setBusy(action);
    try {
      await api("/admin/demo-data", { method: "POST", json: { action } });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const points = useMemo(
    () =>
      (data?.points ?? []).map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        color: sevColors[p.severity] ?? "#888",
        label: `${p.sos ? "SOS · " : ""}${p.species} · ${p.severity} · ${STATUS_LABEL[p.status]}`,
        href: `/dashboard/admin/requests/${p.id}`,
      })),
    [data, sevColors],
  );

  const k = data?.kpis;

  return (
    <>
      <PageHeader title="Analytics" subtitle="How fast animals get help, where, and when. Updates live.">
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Date range" className="inline-flex rounded-lg border bg-muted/50 p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={days === r}
                onClick={() => setDays(r)}
                className={cn("rounded-md px-3 py-1 text-sm", days === r ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {r}d
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
            <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="accent-[hsl(var(--primary))]" />
            Demo data
          </label>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/admin/analytics/export.csv?days=${days}&demo=${demo}`} download>
              <Download className="h-4 w-4" /> CSV
            </a>
          </Button>
        </div>
      </PageHeader>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {data && (
        <Card className="mb-6 flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Database className="h-4 w-4" />
            {data.demoCount
              ? `${data.demoCount} synthetic demo records are loaded${demo ? " and included below" : " (hidden)"}. They never reach real NGOs.`
              : "Only real reports so far. Load ~230 synthetic records over 60 days to see the dashboard at scale."}
          </p>
          {data.demoCount ? (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => demoAction("purge")} disabled={busy !== null}>
              {busy === "purge" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove demo data
            </Button>
          ) : (
            <Button size="sm" onClick={() => demoAction("seed")} disabled={busy !== null}>
              {busy === "seed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Load demo data
            </Button>
          )}
        </Card>
      )}

      {!data && !error ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        data &&
        k && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard label={`Reports${k.changePct !== null ? ` (${k.changePct > 0 ? "+" : ""}${k.changePct}%)` : ""}`} value={k.total} icon={PawPrint} />
              <StatCard label="Rescue rate" value={`${k.rescueRate}%`} icon={HeartPulse} tone="accent" />
              <StatCard label="Median time to accept" value={fmtMin(k.medianAcceptMin)} icon={Clock} tone="warning" />
              <StatCard label="Median time to rescue" value={fmtMin(k.medianRescueMin)} icon={CheckCircle2} />
              <StatCard label="SOS emergencies" value={k.sos} icon={Siren} tone="danger" />
              <StatCard label="Duplicates merged by AI" value={k.duplicates} icon={Copy} tone="accent" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <Card>
                <CardHeader>
                  <CardTitle>Reports vs resolved</CardTitle>
                  <CardDescription>Daily, last {days} days (IST)</CardDescription>
                </CardHeader>
                <CardContent>
                  <TrendChart data={data.trend} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" /> Insights
                  </CardTitle>
                  <CardDescription>Computed from the numbers on this page</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    {data.insights.map((i) => {
                      const Icon = i.tone === "good" ? CheckCircle2 : i.tone === "warn" ? AlertTriangle : Info;
                      return (
                        <li key={i.text} className="flex gap-2">
                          <Icon
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              i.tone === "good" ? "text-emerald-600 dark:text-emerald-400" : i.tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
                            )}
                          />
                          {i.text}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>By species</CardTitle>
                </CardHeader>
                <CardContent>
                  <SpeciesChart data={data.species} total={k.total} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>By severity</CardTitle>
                  <CardDescription>
                    AI triage{k.avgSeverityScore !== null ? ` · average score ${k.avgSeverityScore}/100` : ""}
                    {k.aiSpeciesMismatches ? ` · ${k.aiSpeciesMismatches} species corrections` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SeverityChart data={data.severity} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>When animals need help</CardTitle>
                <CardDescription>Reports by weekday and hour (IST). Hover a cell for the count.</CardDescription>
              </CardHeader>
              <CardContent>
                <WeekHeatmap data={data.heatmap} />
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle>Where incidents happen</CardTitle>
                  <CardDescription>{data.points.length} reports. Click a dot to open the case.</CardDescription>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {["critical", "high", "medium", "low"].map((s) => (
                    <span key={s} className="flex items-center gap-1.5 capitalize">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(${SEV_VAR[s]})` }} />
                      {s}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <div className="h-[420px]">
                <PointsMap points={points} />
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>NGO leaderboard</CardTitle>
                <CardDescription>Cases accepted in the last {days} days</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {data.leaderboard.length ? (
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                        <th className="py-2 pr-3 font-medium">#</th>
                        <th className="py-2 pr-3 font-medium">NGO</th>
                        <th className="py-2 pr-3 text-right font-medium">Accepted</th>
                        <th className="py-2 pr-3 text-right font-medium">Rescued</th>
                        <th className="py-2 pr-3 text-right font-medium">Recovered</th>
                        <th className="py-2 pr-3 text-right font-medium">SOS</th>
                        <th className="py-2 pr-3 text-right font-medium">Rescue rate</th>
                        <th className="py-2 text-right font-medium">Median accept</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leaderboard.map((n, i) => (
                        <tr key={n.ngoId} className="border-b last:border-0">
                          <td className="py-2.5 pr-3 text-muted-foreground">{i + 1}</td>
                          <td className="py-2.5 pr-3 font-medium">{n.name}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{n.accepted}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{n.rescued}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{n.recovered}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{n.sos}</td>
                          <td className="py-2.5 pr-3 text-right tabular-nums">
                            <Badge variant={n.rescueRate >= 80 ? "success" : n.rescueRate >= 60 ? "default" : "warning"}>{n.rescueRate}%</Badge>
                          </td>
                          <td className="py-2.5 text-right tabular-nums">{fmtMin(n.medianAcceptMin)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground">No accepted cases in this period.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )
      )}
    </>
  );
}
