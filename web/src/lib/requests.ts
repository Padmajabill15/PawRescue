export const SPECIES = ["dog", "cat", "cow", "bird", "monkey", "wildlife", "reptile", "other"] as const;
export type Species = (typeof SPECIES)[number];

export const STATUS_FLOW = ["submitted", "accepted", "on_the_way", "rescued", "treatment", "recovered", "closed"] as const;
export type RequestStatus = (typeof STATUS_FLOW)[number];
export type Severity = "low" | "medium" | "high" | "critical";

export const STATUS_LABEL: Record<RequestStatus, string> = {
  submitted: "Submitted",
  accepted: "NGO accepted",
  on_the_way: "Team on the way",
  rescued: "Rescued",
  treatment: "Under treatment",
  recovered: "Recovered",
  closed: "Closed",
};

export const SEVERITY_BADGE = {
  low: "muted",
  medium: "default",
  high: "warning",
  critical: "danger",
} as const;

export const SPECIES_EMOJI: Record<Species, string> = {
  dog: "🐕",
  cat: "🐈",
  cow: "🐄",
  bird: "🐦",
  monkey: "🐒",
  wildlife: "🦊",
  reptile: "🐍",
  other: "🐾",
};

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface RescueRequest {
  _id: string;
  description?: string;
  species: Species;
  severity: Severity;
  status: RequestStatus;
  isEmergency: boolean;
  images: string[];
  location: GeoPoint;
  address?: string;
  contactPhone?: string;
  animalCount: number;
  nearbyNgoCount: number;
  assignedNgo?: { _id: string; name: string; phone?: string; email?: string; address?: string; location?: GeoPoint } | null;
  reporter?: { _id: string; name: string; phone?: string; email?: string } | string;
  statusHistory: { status: RequestStatus; note?: string; at: string }[];
  createdAt: string;
  updatedAt: string;
  distanceKm?: number;
}

export interface TreatmentUpdate {
  _id: string;
  notes: string;
  images: string[];
  createdAt: string;
}

export type RequestDetail = RescueRequest & { updates: TreatmentUpdate[] };

export function timeAgo(iso: string) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString();
}

export const nextStatuses = (s: RequestStatus) => STATUS_FLOW.slice(STATUS_FLOW.indexOf(s) + 1);
