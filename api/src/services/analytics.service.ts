import { Types } from "mongoose";
import { Ngo } from "../models/Ngo";
import { RescueRequest } from "../models/RescueRequest";

const TZ = "Asia/Kolkata";
const DAY = 86_400_000;
const RESOLVED = ["recovered", "closed"];
/** A case counts as rescued only if it actually reached "rescued" (not closed as not-found / unassigned). */
const WAS_RESCUED = { $in: ["rescued", { $ifNull: ["$statusHistory.status", []] }] };

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return Math.round((s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) * 10) / 10;
};
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

interface Facets {
  kpi: { total: number; sos: number; duplicates: number; resolved: number; rescued: number; unassigned: number; escalated: number; avgScore: number | null; mismatches: number }[];
  previous: { total: number }[];
  daily: { _id: string; reported: number }[];
  resolvedDaily: { _id: string; resolved: number }[];
  species: { _id: string; count: number }[];
  severity: { _id: string; count: number }[];
  hourWeek: { _id: { dow: number; hour: number }; count: number }[];
  times: { sos: boolean; acceptMin: number | null; rescueMin: number | null }[];
  points: { _id: Types.ObjectId; c: [number, number]; severity: string; species: string; status: string; sos: boolean }[];
}

async function snapshot(days: number, includeDemo: boolean) {
  const now = Date.now();
  const since = new Date(now - days * DAY);
  const prevSince = new Date(now - 2 * days * DAY);
  const demo = includeDemo ? {} : { isDemo: { $ne: true } };
  const current = { createdAt: { $gte: since } };
  const primary = { ...current, duplicateOf: null }; // merged duplicates don't count as separate rescues

  const [f] = await RescueRequest.aggregate<Facets>([
    { $match: { createdAt: { $gte: prevSince }, ...demo } },
    {
      $facet: {
        kpi: [
          { $match: current },
          {
            $group: {
              _id: null,
              total: { $sum: { $cond: [{ $ifNull: ["$duplicateOf", false] }, 0, 1] } },
              duplicates: { $sum: { $cond: [{ $ifNull: ["$duplicateOf", false] }, 1, 0] } },
              sos: { $sum: { $cond: ["$isEmergency", 1, 0] } },
              resolved: { $sum: { $cond: [{ $in: ["$status", RESOLVED] }, 1, 0] } },
              rescued: { $sum: { $cond: [WAS_RESCUED, 1, 0] } },
              unassigned: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "submitted"] }, { $not: [{ $ifNull: ["$duplicateOf", false] }] }] }, 1, 0] } },
              escalated: { $sum: { $cond: [{ $gt: [{ $ifNull: ["$escalationLevel", 0] }, 0] }, 1, 0] } },
              avgScore: { $avg: "$ai.severityScore" },
              mismatches: {
                $sum: {
                  $cond: [{ $and: [{ $eq: ["$ai.source", "model"] }, { $gte: ["$ai.speciesConfidence", 0.6] }, { $ne: ["$ai.species", "$species"] }] }, 1, 0],
                },
              },
            },
          },
        ],
        previous: [{ $match: { createdAt: { $lt: since }, duplicateOf: null } }, { $count: "total" }],
        daily: [
          { $match: primary },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, reported: { $sum: 1 } } },
        ],
        resolvedDaily: [
          { $match: { closedAt: { $gte: since }, duplicateOf: null } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$closedAt", timezone: TZ } }, resolved: { $sum: 1 } } },
        ],
        species: [{ $match: primary }, { $group: { _id: "$species", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        severity: [{ $match: primary }, { $group: { _id: "$severity", count: { $sum: 1 } } }],
        hourWeek: [
          { $match: primary },
          {
            $group: {
              _id: { dow: { $dayOfWeek: { date: "$createdAt", timezone: TZ } }, hour: { $hour: { date: "$createdAt", timezone: TZ } } },
              count: { $sum: 1 },
            },
          },
        ],
        times: [
          { $match: { ...primary, acceptedAt: { $exists: true } } },
          {
            $project: {
              sos: "$isEmergency",
              acceptMin: { $divide: [{ $subtract: ["$acceptedAt", "$createdAt"] }, 60_000] },
              rescueAt: {
                $first: { $map: { input: { $filter: { input: "$statusHistory", cond: { $eq: ["$$this.status", "rescued"] } } }, in: "$$this.at" } },
              },
              createdAt: 1,
            },
          },
          {
            $project: {
              sos: 1,
              acceptMin: 1,
              rescueMin: { $cond: ["$rescueAt", { $divide: [{ $subtract: ["$rescueAt", "$createdAt"] }, 60_000] }, null] },
            },
          },
        ],
        points: [
          { $match: primary },
          { $project: { c: "$location.coordinates", severity: 1, species: 1, status: 1, sos: "$isEmergency" } },
          { $limit: 3000 },
        ],
      },
    },
  ]);

  const k = f.kpi[0] ?? { total: 0, sos: 0, duplicates: 0, resolved: 0, rescued: 0, unassigned: 0, escalated: 0, avgScore: null, mismatches: 0 };
  const prevTotal = f.previous[0]?.total ?? 0;

  // Continuous day series (zero-filled) so the trend line has no gaps
  const reported = new Map(f.daily.map((d) => [d._id, d.reported]));
  const resolved = new Map(f.resolvedDaily.map((d) => [d._id, d.resolved]));
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const trend = Array.from({ length: days }, (_, i) => {
    const date = fmt.format(new Date(now - (days - 1 - i) * DAY));
    return { date, reported: reported.get(date) ?? 0, resolved: resolved.get(date) ?? 0 };
  });

  const accept = f.times.map((t) => t.acceptMin).filter((x): x is number => x !== null);
  const acceptSos = f.times.filter((t) => t.sos).map((t) => t.acceptMin).filter((x): x is number => x !== null);
  const rescue = f.times.map((t) => t.rescueMin).filter((x): x is number => x !== null);

  // Mongo $dayOfWeek: 1 = Sunday … 7 = Saturday -> 0 = Monday … 6 = Sunday
  const heat: number[][] = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const h of f.hourWeek) heat[(h._id.dow + 5) % 7][h._id.hour] += h.count;

  const leaderboard = await ngoLeaderboard(since, demo);

  const result = {
    range: { days, since: since.toISOString(), includeDemo },
    kpis: {
      total: k.total,
      previousTotal: prevTotal,
      changePct: prevTotal ? Math.round(((k.total - prevTotal) / prevTotal) * 1000) / 10 : null,
      sos: k.sos,
      duplicates: k.duplicates,
      rescued: k.rescued,
      resolved: k.resolved,
      rescueRate: pct(k.rescued, k.total),
      unassigned: k.unassigned,
      escalated: k.escalated,
      medianAcceptMin: median(accept),
      medianAcceptSosMin: median(acceptSos),
      medianRescueMin: median(rescue),
      avgSeverityScore: k.avgScore === null ? null : Math.round(k.avgScore),
      aiSpeciesMismatches: k.mismatches,
    },
    trend,
    species: f.species.map((s) => ({ species: s._id, count: s.count })),
    severity: ["critical", "high", "medium", "low"].map((s) => ({ severity: s, count: f.severity.find((x) => x._id === s)?.count ?? 0 })),
    heatmap: heat,
    points: f.points.map((p) => ({ id: String(p._id), lat: p.c[1], lng: p.c[0], severity: p.severity, species: p.species, status: p.status, sos: p.sos })),
    leaderboard,
    demoCount: await RescueRequest.countDocuments({ isDemo: true }),
  };
  return result;
}

export async function getAnalytics(days: number, includeDemo: boolean) {
  const s = await snapshot(days, includeDemo);
  return { ...s, insights: buildInsights(s) };
}

async function ngoLeaderboard(since: Date, demo: object) {
  const rows = await RescueRequest.aggregate<{
    _id: Types.ObjectId;
    accepted: number;
    rescued: number;
    recovered: number;
    sos: number;
    acceptMins: number[];
  }>([
    { $match: { createdAt: { $gte: since }, assignedNgo: { $ne: null }, ...demo } },
    {
      $group: {
        _id: "$assignedNgo",
        accepted: { $sum: 1 },
        rescued: { $sum: { $cond: [WAS_RESCUED, 1, 0] } },
        recovered: { $sum: { $cond: [{ $eq: ["$status", "recovered"] }, 1, 0] } },
        sos: { $sum: { $cond: ["$isEmergency", 1, 0] } },
        acceptMins: { $push: { $divide: [{ $subtract: ["$acceptedAt", "$createdAt"] }, 60_000] } },
      },
    },
    { $sort: { accepted: -1 } },
    { $limit: 10 },
  ]);
  const ngos = await Ngo.find({ _id: { $in: rows.map((r) => r._id) } }).select("name address capacity").lean();
  const byId = new Map(ngos.map((n) => [String(n._id), n]));
  return rows.map((r) => ({
    ngoId: String(r._id),
    name: byId.get(String(r._id))?.name ?? "Unknown NGO",
    accepted: r.accepted,
    rescued: r.rescued,
    recovered: r.recovered,
    sos: r.sos,
    rescueRate: pct(r.rescued, r.accepted),
    medianAcceptMin: median(r.acceptMins.filter((x) => typeof x === "number")),
  }));
}

type Snapshot = Awaited<ReturnType<typeof snapshot>>;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
const mins = (m: number) => (m >= 90 ? `${Math.round((m / 60) * 10) / 10} h` : `${Math.round(m)} min`);

/** Plain-language findings computed from the numbers (deterministic, no LLM needed). */
export function buildInsights(a: Snapshot) {
  const out: { tone: "good" | "warn" | "info"; text: string }[] = [];
  const k = a.kpis;
  if (!k.total) return [{ tone: "info" as const, text: "No reports in this period yet." }];

  if (k.changePct !== null && Math.abs(k.changePct) >= 10) {
    out.push({
      tone: k.changePct > 0 ? "warn" : "info",
      text: `Reports ${k.changePct > 0 ? "rose" : "fell"} ${Math.abs(k.changePct)}% vs the previous ${a.range.days} days (${k.previousTotal} → ${k.total}).`,
    });
  }

  const top = a.species[0];
  if (top) out.push({ tone: "info", text: `${top.species[0].toUpperCase()}${top.species.slice(1)}s make up ${pct(top.count, k.total)}% of reports, the largest group.` });

  // Busiest 3-hour window across the week
  const byHour = Array.from({ length: 24 }, (_, h) => a.heatmap.reduce((s, row) => s + row[h], 0));
  let bestStart = 0;
  let bestSum = -1;
  for (let h = 0; h < 24; h++) {
    const sum = byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24];
    if (sum > bestSum) [bestStart, bestSum] = [h, sum];
  }
  if (bestSum > 0) {
    out.push({
      tone: "info",
      text: `Peak window is ${hourLabel(bestStart)}–${hourLabel((bestStart + 3) % 24)} (${pct(bestSum, k.total)}% of reports). Worth having volunteers on call then.`,
    });
  }
  const byDay = a.heatmap.map((row) => row.reduce((s, x) => s + x, 0));
  const busiest = byDay.indexOf(Math.max(...byDay));
  if (byDay[busiest] > 0) out.push({ tone: "info", text: `${DAYS[busiest]} is the busiest day of the week.` });

  if (k.medianAcceptMin !== null) {
    out.push({
      tone: k.medianAcceptMin <= 15 ? "good" : "warn",
      text: `Median time for an NGO to accept is ${mins(k.medianAcceptMin)}${k.medianAcceptSosMin !== null ? ` (SOS: ${mins(k.medianAcceptSosMin)})` : ""}.`,
    });
  }
  out.push({ tone: k.rescueRate >= 70 ? "good" : "warn", text: `${k.rescueRate}% of reported animals were rescued (${k.rescued} of ${k.total}).` });

  if (k.unassigned > 0) out.push({ tone: "warn", text: `${k.unassigned} report${k.unassigned > 1 ? "s are" : " is"} still waiting for an NGO. Check coverage gaps on the map.` });
  if (k.duplicates > 0) out.push({ tone: "good", text: `AI merged ${k.duplicates} duplicate report${k.duplicates > 1 ? "s" : ""}, avoiding repeat dispatches.` });
  if (k.aiSpeciesMismatches > 0) out.push({ tone: "info", text: `AI disagreed with the reporter's chosen species in ${k.aiSpeciesMismatches} report${k.aiSpeciesMismatches > 1 ? "s" : ""}.` });

  const lead = a.leaderboard[0];
  if (lead) out.push({ tone: "good", text: `${lead.name} handled the most cases (${lead.accepted}), with a ${lead.rescueRate}% rescue rate.` });
  return out;
}

export async function exportCsv(days: number, includeDemo: boolean) {
  const since = new Date(Date.now() - days * DAY);
  const rows = await RescueRequest.find({ createdAt: { $gte: since }, ...(includeDemo ? {} : { isDemo: { $ne: true } }) })
    .sort({ createdAt: -1 })
    .populate<{ assignedNgo: { name: string } | null }>("assignedNgo", "name")
    .lean();
  const head = ["id", "created_at", "species", "animal_count", "severity", "ai_severity_score", "ai_species", "ai_injury_prob", "emergency", "status", "lat", "lng", "ngo", "accept_min", "duplicate_of", "demo"];
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [
      r._id,
      r.createdAt.toISOString(),
      r.species,
      r.animalCount,
      r.severity,
      r.ai?.severityScore,
      r.ai?.species,
      r.ai?.injuryProbability,
      r.isEmergency,
      r.status,
      r.location.coordinates[1],
      r.location.coordinates[0],
      r.assignedNgo?.name,
      r.acceptedAt ? Math.round(((r.acceptedAt.getTime() - r.createdAt.getTime()) / 60_000) * 10) / 10 : "",
      r.duplicateOf ?? "",
      r.isDemo ?? false,
    ]
      .map(esc)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
