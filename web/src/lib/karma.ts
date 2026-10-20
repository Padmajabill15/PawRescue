import type { RescueRequest } from "@/lib/requests";

export const LEVELS = [
  { name: "Pup", min: 0 },
  { name: "Watcher", min: 50 },
  { name: "Guardian", min: 150 },
  { name: "Hero", min: 400 },
  { name: "Legend", min: 1000 },
] as const;

export interface Badge {
  id: string;
  name: string;
  how: string;
  emoji: string;
  unlocked: boolean;
  progress?: [number, number];
}

const reached = (r: RescueRequest, s: string) => r.statusHistory?.some((h) => h.status === s);

/** "Rescue Karma": points and badges derived from a reporter's own reports. */
export function computeKarma(reports: RescueRequest[]) {
  let points = 0;
  let rescued = 0;
  let recovered = 0;
  let night = false;
  let sos = false;
  let dup = false;
  for (const r of reports) {
    points += r.duplicateOf ? 5 : 10;
    if (r.isEmergency) (points += 5), (sos = true);
    if (r.duplicateOf) dup = true;
    if (reached(r, "rescued")) (points += 20), rescued++;
    if (r.status === "recovered") (points += 30), recovered++;
    const h = new Date(r.createdAt).getHours();
    if (h >= 20 || h < 6) night = true;
  }
  const idx = LEVELS.reduce((acc, l, i) => (points >= l.min ? i : acc), 0);
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const badges: Badge[] = [
    { id: "first", name: "First call", how: "Report your first animal", emoji: "📣", unlocked: reports.length > 0 },
    { id: "life", name: "Lifesaver", how: "An animal you reported gets rescued", emoji: "🛟", unlocked: rescued > 0 },
    { id: "happy", name: "Happy ending", how: "An animal you reported recovers", emoji: "💚", unlocked: recovered > 0 },
    { id: "sos", name: "Quick reflexes", how: "Send an emergency SOS", emoji: "🚨", unlocked: sos },
    { id: "night", name: "Night watch", how: "Report between 8 pm and 6 am", emoji: "🌙", unlocked: night },
    { id: "eyes", name: "Second pair of eyes", how: "Confirm an animal someone else reported", emoji: "👀", unlocked: dup },
    { id: "five", name: "Five lives", how: "5 of your reports rescued", emoji: "🐾", unlocked: rescued >= 5, progress: [Math.min(rescued, 5), 5] },
    { id: "ten", name: "Neighbourhood guardian", how: "Report 10 animals", emoji: "🏅", unlocked: reports.length >= 10, progress: [Math.min(reports.length, 10), 10] },
  ];
  return {
    points,
    level: level.name,
    nextLevel: next?.name ?? null,
    toNext: next ? next.min - points : 0,
    pct: next ? Math.round(((points - level.min) / (next.min - level.min)) * 100) : 100,
    badges,
  };
}
