import { Types } from "mongoose";
import { Ngo } from "../models/Ngo";
import { RescueRequest } from "../models/RescueRequest";
import { User } from "../models/User";

const CAP = 5000;
const DEMO_EMAIL = /@demo\.pawrescue\.dev$/;
const countMap = (rows: { _id: Types.ObjectId | null; n: number }[]) => new Map(rows.map((r) => [String(r._id), r.n]));

/** Every active account, with how many reports each filed. Never returns password hashes or Google IDs. */
export async function usersSheet(includeDemo: boolean) {
  const [users, reports, ngos] = await Promise.all([
    User.find({ isActive: true, ...(includeDemo ? {} : { email: { $not: DEMO_EMAIL } }) })
      .select("name email phone role authProvider isEmergencyUser deletionRequest createdAt")
      .sort({ createdAt: -1 })
      .limit(CAP)
      .lean(),
    RescueRequest.aggregate<{ _id: Types.ObjectId; n: number }>([{ $group: { _id: "$reporter", n: { $sum: 1 } } }]),
    Ngo.find().select("owner name").lean(),
  ]);
  const byReporter = countMap(reports);
  const ngoName = new Map(ngos.map((n) => [String(n.owner), n.name]));
  return users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email ?? "",
    phone: u.phone ?? "",
    role: u.role,
    signIn: u.authProvider,
    ngo: ngoName.get(String(u._id)) ?? "",
    reports: byReporter.get(String(u._id)) ?? 0,
    deletionRequested: Boolean(u.deletionRequest?.requestedAt),
    joined: u.createdAt,
  }));
}

export async function ngosSheet(includeDemo: boolean) {
  const [ngos, cases] = await Promise.all([
    Ngo.find(includeDemo ? {} : { email: { $not: DEMO_EMAIL } }).sort({ createdAt: -1 }).limit(CAP).lean(),
    RescueRequest.aggregate<{ _id: Types.ObjectId; n: number; recovered: number; sos: number }>([
      { $match: { assignedNgo: { $ne: null } } },
      {
        $group: {
          _id: "$assignedNgo",
          n: { $sum: 1 },
          recovered: { $sum: { $cond: [{ $eq: ["$status", "recovered"] }, 1, 0] } },
          sos: { $sum: { $cond: ["$isEmergency", 1, 0] } },
        },
      },
    ]),
  ]);
  const stats = new Map(cases.map((c) => [String(c._id), c]));
  return ngos.map((n) => {
    const s = stats.get(String(n._id));
    return {
      id: String(n._id),
      name: n.name,
      email: n.email,
      phone: n.phone,
      address: n.address ?? "",
      registrationNumber: n.registrationNumber ?? "",
      status: n.verificationStatus,
      serviceRadiusKm: n.serviceRadiusKm,
      capacity: n.capacity,
      specializations: (n.specializations ?? []).join(", "),
      casesAccepted: s?.n ?? 0,
      recovered: s?.recovered ?? 0,
      sosHandled: s?.sos ?? 0,
      lat: n.location?.coordinates?.[1],
      lng: n.location?.coordinates?.[0],
      joined: n.createdAt,
    };
  });
}

export async function requestsSheet(includeDemo: boolean) {
  const rows = await RescueRequest.find(includeDemo ? {} : { isDemo: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(CAP)
    .populate<{ reporter: { name: string; phone?: string; email?: string } | null }>("reporter", "name phone email")
    .populate<{ assignedNgo: { name: string; phone?: string } | null }>("assignedNgo", "name phone")
    .lean();
  return rows.map((r) => ({
    id: String(r._id),
    created: r.createdAt,
    species: r.species,
    severity: r.severity,
    aiScore: r.ai?.severityScore ?? null,
    status: r.status,
    sos: r.isEmergency,
    reporter: r.reporter?.name ?? "",
    reporterPhone: r.contactPhone || r.reporter?.phone || "",
    reporterEmail: r.reporter?.email ?? "",
    ngo: r.assignedNgo?.name ?? "",
    ngoPhone: r.assignedNgo?.phone ?? "",
    address: r.address ?? "",
    lat: r.location.coordinates[1],
    lng: r.location.coordinates[0],
    duplicate: Boolean(r.duplicateOf),
    demo: Boolean(r.isDemo),
  }));
}

/** Public-to-signed-in directory of verified NGOs (contact details NGOs registered to be reached on). */
export function ngoDirectory() {
  return Ngo.find({ verificationStatus: "approved", email: { $not: DEMO_EMAIL } })
    .select("name phone email address description specializations serviceRadiusKm capacity location")
    .sort({ name: 1 })
    .limit(CAP)
    .lean();
}
