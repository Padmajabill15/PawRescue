"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SPECIES_EMOJI, type Species } from "@/lib/requests";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 12, tickLine: false, axisLine: false } as const;
const grid = { stroke: "hsl(var(--border))", strokeDasharray: "0", vertical: false } as const;

function TipBox({ title, rows }: { title: string; rows: { label: string; value: string | number; color?: string }[] }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-muted-foreground">
          {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />}
          {r.label}: <span className="font-medium text-foreground tabular-nums">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

export function TrendChart({ data }: { data: { date: string; reported: number; resolved: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid {...grid} />
          <XAxis dataKey="date" {...axis} tickFormatter={shortDate} minTickGap={24} />
          <YAxis {...axis} allowDecimals={false} width={40} />
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TipBox
                  title={shortDate(String(label))}
                  rows={payload.map((p) => ({ label: String(p.name), value: Number(p.value), color: String(p.color) }))}
                />
              ) : null
            }
          />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="reported" name="Reported" stroke="var(--series-1)" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }} />
          <Line type="monotone" dataKey="resolved" name="Recovered / closed" stroke="var(--series-2)" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpeciesChart({ data, total }: { data: { species: string; count: number }[]; total: number }) {
  const rows = data.map((d) => ({ ...d, label: `${SPECIES_EMOJI[d.species as Species] ?? ""} ${d.species}` }));
  return (
    <div style={{ height: Math.max(160, rows.length * 34) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" {...axis} width={92} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <TipBox title={String(payload[0].payload.label)} rows={[{ label: "Reports", value: `${payload[0].value} (${total ? Math.round((Number(payload[0].value) / total) * 100) : 0}%)` }]} />
              ) : null
            }
          />
          <Bar dataKey="count" fill="var(--series-1)" radius={[0, 4, 4, 0]} maxBarSize={22}>
            <LabelList dataKey="count" position="right" className="fill-muted-foreground text-xs" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SEV_COLOR: Record<string, string> = {
  critical: "var(--sev-critical)",
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
};

export function SeverityChart({ data }: { data: { severity: string; count: number }[] }) {
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }} barCategoryGap={6}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="severity" {...axis} width={70} tickFormatter={(s: string) => s[0].toUpperCase() + s.slice(1)} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={({ active, payload }) =>
              active && payload?.length ? <TipBox title={`${payload[0].payload.severity} severity`} rows={[{ label: "Reports", value: Number(payload[0].value) }]} /> : null
            }
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {data.map((d) => (
              <Cell key={d.severity} fill={SEV_COLOR[d.severity]} />
            ))}
            <LabelList dataKey="count" position="right" className="fill-muted-foreground text-xs" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "a" : "p"}`;

/** Weekday × hour heatmap: one hue, light → dark (sequential). */
export function WeekHeatmap({ data }: { data: number[][] }) {
  const max = Math.max(1, ...data.flat());
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid min-w-full gap-[2px]" style={{ gridTemplateColumns: "36px repeat(24, minmax(14px, 1fr))" }}>
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="text-center text-[10px] text-muted-foreground">
            {h % 3 === 0 ? hourLabel(h) : ""}
          </span>
        ))}
        {data.map((row, d) => (
          <div key={DAYS[d]} className="contents">
            <span className="pr-1 text-right text-xs leading-5 text-muted-foreground">{DAYS[d]}</span>
            {row.map((v, h) => (
              <span
                key={h}
                title={`${DAYS[d]} ${hourLabel(h)}m–${hourLabel((h + 1) % 24)}m: ${v} report${v === 1 ? "" : "s"}`}
                className="h-5 rounded-[3px] ring-primary/60 hover:ring-2"
                style={{ background: v ? `hsl(var(--primary) / ${0.12 + 0.88 * (v / max)})` : "hsl(var(--muted))" }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        Fewer
        {[0.12, 0.34, 0.56, 0.78, 1].map((a) => (
          <span key={a} className="h-3 w-5 rounded-sm" style={{ background: `hsl(var(--primary) / ${a})` }} />
        ))}
        More · max {max} in one hour slot
      </div>
    </div>
  );
}
