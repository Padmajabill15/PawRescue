import type { Severity } from "../models/RescueRequest";

// Rule-based first pass; replaced by the ML triage service in a later phase.
const RULES: [Severity, RegExp][] = [
  ["critical", /\b(bleeding heavily|unconscious|not breathing|hit by (a )?(car|bus|truck|vehicle|bike)|run over|seizure|electrocut|drowning|trapped)\b/i],
  ["high", /\b(bleed|blood|fracture|broken|wound|accident|limp|can'?t (walk|stand)|maggot|burn|poison|attack|bitten)\b/i],
  ["medium", /\b(sick|weak|injur|hurt|stuck|abandon|starv|thin|skin|infect|eye)\b/i],
];

export function triageSeverity(text: string | undefined, isEmergency: boolean): Severity {
  const hit = RULES.find(([, re]) => re.test(text ?? ""))?.[0];
  if (isEmergency) return hit === "critical" ? "critical" : "high";
  return hit ?? "low";
}
