/**
 * Synthetic demo history for the analytics dashboard.
 * Everything is flagged (isDemo / @demo.pawrescue.dev) so it can be purged in one call,
 * and it is excluded from NGO request lists and escalation.
 */
import { Types } from "mongoose";
import { Ngo } from "../models/Ngo";
import { Notification } from "../models/Notification";
import { RescueRequest, type RequestStatus, type Severity } from "../models/RescueRequest";
import { TreatmentUpdate } from "../models/TreatmentUpdate";
import { User } from "../models/User";
import { hashPassword } from "./auth.service";

const DEMO_DOMAIN = "demo.pawrescue.dev";
const DEMO_EMAIL = new RegExp(`@${DEMO_DOMAIN.replace(/\./g, "\\.")}$`);

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HUBS = [
  { name: "Koramangala", lat: 12.9352, lng: 77.6245, weight: 0.3, ngo: "Koramangala Paws Clinic" },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963, weight: 0.2, ngo: "Yelahanka Animal Aid" },
  { name: "KR Puram", lat: 12.9975, lng: 77.6787, weight: 0.3, ngo: "Eastside Rescue Collective" },
  { name: "Belagavi", lat: 15.8497, lng: 74.4977, weight: 0.2, ngo: "Belagavi Street Animal Trust" },
];

const SPECIES: [string, number][] = [
  ["dog", 0.45], ["cat", 0.18], ["cow", 0.12], ["bird", 0.13], ["monkey", 0.05], ["wildlife", 0.03], ["reptile", 0.02], ["other", 0.02],
];

const STORIES: Record<Severity, string[]> = {
  critical: ["hit by a car and not moving", "bleeding heavily after an accident", "unconscious on the road", "electrocuted near a transformer", "trapped in a deep drain"],
  high: ["has a deep wound on its leg", "is limping badly and can't stand", "has maggots in a wound", "was attacked by other animals, bleeding", "has a broken leg"],
  medium: ["looks weak and thin", "has a skin infection", "is stuck behind a fence", "has an eye infection", "seems sick and is vomiting"],
  low: ["looks lost and scared", "is abandoned near the market", "has a minor scratch", "needs a check-up, mild limp"],
};
const SCORE: Record<Severity, [number, number]> = { critical: [72, 100], high: [46, 69], medium: [21, 44], low: [4, 19] };

export async function purgeDemo() {
  const users = await User.find({ email: DEMO_EMAIL }).select("_id").lean();
  const ids = users.map((u) => u._id);
  const reqIds = await RescueRequest.find({ isDemo: true }).distinct("_id");
  const [r, , n] = await Promise.all([
    RescueRequest.deleteMany({ isDemo: true }),
    TreatmentUpdate.deleteMany({ request: { $in: reqIds } }),
    Ngo.deleteMany({ email: DEMO_EMAIL }),
    Notification.deleteMany({ recipient: { $in: ids } }),
  ]);
  await User.deleteMany({ email: DEMO_EMAIL });
  return { requests: r.deletedCount, ngos: n.deletedCount, users: ids.length };
}

export async function seedDemo(count = 220, days = 60) {
  await purgeDemo();
  const rand = rng(20261020);
  const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const weighted = <T>(xs: [T, number][]) => {
    let r = rand();
    for (const [x, w] of xs) if ((r -= w) <= 0) return x;
    return xs[xs.length - 1][0];
  };
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
  const logNormal = (medianMin: number, spread = 0.7) => medianMin * Math.exp(gauss() * spread);
  const between = (a: number, b: number) => a + rand() * (b - a);

  const passwordHash = await hashPassword("Demo@12345");
  const reporters = await User.insertMany(
    ["Asha", "Rahul", "Meera", "Imran", "Kavya", "Arjun", "Divya", "Suresh"].map((name, i) => ({
      name: `${name} (demo)`,
      email: `reporter${i + 1}@${DEMO_DOMAIN}`,
      passwordHash,
      authProvider: "password",
      role: "user",
    })),
  );
  const ngoOwners = await User.insertMany(
    HUBS.map((h, i) => ({ name: h.ngo, email: `ngo${i + 1}@${DEMO_DOMAIN}`, passwordHash, authProvider: "password", role: "ngo" })),
  );
  const ngos = await Ngo.insertMany(
    HUBS.map((h, i) => ({
      owner: ngoOwners[i]._id,
      name: h.ngo,
      email: `ngo${i + 1}@${DEMO_DOMAIN}`,
      phone: `90000000${10 + i}`,
      address: `${h.name} (demo)`,
      verificationStatus: "approved",
      location: { type: "Point", coordinates: [h.lng, h.lat] },
      serviceRadiusKm: 12,
      capacity: 20 + i * 10,
      specializations: ["dogs", "cats", "birds"],
    })),
  );

  const now = Date.now();
  const docs: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const hubIdx = HUBS.indexOf(weighted(HUBS.map((h) => [h, h.weight] as [typeof h, number])));
    const hub = HUBS[hubIdx];
    // More reports recently (growth) + morning/evening peaks + weekend bump
    const dayAgo = Math.floor(days * Math.pow(rand(), 1.25));
    const hour = weighted<number>([
      [Math.floor(between(7, 10)), 0.33],
      [Math.floor(between(17, 21)), 0.42],
      [Math.floor(between(0, 24)), 0.25],
    ]);
    const created = new Date(now - dayAgo * 86_400_000);
    created.setUTCHours(hour - 5, Math.floor(rand() * 60) - 30, 0, 0); // IST -> UTC
    if (created.getTime() > now) created.setTime(now - between(5, 600) * 60_000);

    const species = weighted(SPECIES);
    const isEmergency = rand() < 0.14;
    const severity: Severity = isEmergency
      ? weighted<Severity>([["critical", 0.6], ["high", 0.4]])
      : weighted<Severity>([["critical", 0.08], ["high", 0.3], ["medium", 0.4], ["low", 0.22]]);
    const [lo, hi] = SCORE[severity];
    const mismatch = rand() < 0.05;

    const ageMin = (now - created.getTime()) / 60_000;
    const history: { status: RequestStatus; note?: string; at: Date }[] = [{ status: "submitted", note: isEmergency ? "Emergency SOS raised" : "Report submitted", at: created }];
    let status = "submitted" as RequestStatus;
    let acceptedAt: Date | undefined;
    let closedAt: Date | undefined;
    const ngoForCase = ngos[hubIdx];

    const unattended = rand() < (dayAgo <= 3 ? 0.12 : 0.03);
    const acceptDelay = Math.max(1, logNormal(isEmergency ? 6 : 14));
    if (!unattended && ageMin > acceptDelay) {
      let t = created.getTime() + acceptDelay * 60_000;
      const step = (s: RequestStatus, addMin: number, note?: string) => {
        const at = t + addMin * 60_000;
        if (at > now) return false;
        t = at;
        history.push({ status: s, note, at: new Date(at) });
        status = s;
        return true;
      };
      acceptedAt = new Date(t);
      history.push({ status: "accepted", note: "NGO accepted the rescue", at: acceptedAt });
      status = "accepted";
      if (step("on_the_way", between(2, 8), "Team dispatched")) {
        if (rand() < 0.07) {
          step("closed", between(30, 90), "Animal could not be found at the location");
        } else if (step("rescued", logNormal(isEmergency ? 25 : 45, 0.5), "Animal picked up safely")) {
          if (step("treatment", between(30, 180), "Admitted for treatment")) {
            const outcome = rand();
            if (outcome < 0.86) step("recovered", between(2, 12) * 24 * 60, "Recovered and released / ready for adoption");
            else if (outcome < 0.92) step("closed", between(1, 6) * 24 * 60, "Did not survive despite treatment");
          }
        }
      }
      const last = history[history.length - 1].status;
      if (last === "recovered" || last === "closed") closedAt = new Date(t);
    }

    const lat = hub.lat + gauss() * 0.022;
    const lng = hub.lng + gauss() * 0.022;
    docs.push({
      _id: new Types.ObjectId(),
      reporter: pick(reporters)._id,
      species,
      animalCount: rand() < 0.08 ? 2 : 1,
      description: `${species[0].toUpperCase()}${species.slice(1)} ${pick(STORIES[severity])}`,
      address: `${hub.name} (demo)`,
      images: [],
      location: { type: "Point", coordinates: [lng, lat] },
      isEmergency,
      severity,
      status,
      assignedNgo: acceptedAt ? ngoForCase._id : undefined,
      acceptedAt,
      closedAt,
      statusHistory: history,
      nearbyNgoCount: 1 + Math.floor(rand() * 3),
      escalationLevel: unattended && ageMin > 10 ? 1 : 0,
      ai: {
        source: "model",
        species: mismatch ? pick(["cat", "dog", "wildlife"].filter((s) => s !== species)) : species,
        speciesConfidence: mismatch ? between(0.62, 0.8) : between(0.78, 0.98),
        injuryProbability: Math.min(0.99, between(lo, hi) / 100 + between(-0.1, 0.1)),
        severityScore: Math.round(between(lo, hi)),
        reasons: ["Synthetic demo record"],
        model: "demo",
      },
      isDemo: true,
      createdAt: created,
      updatedAt: closedAt ?? acceptedAt ?? created,
    });
  }

  // ~5% duplicates: a second person reporting the same animal shortly after
  const originals = docs.filter((d) => d.status !== "closed").slice(0, Math.round(count * 0.05));
  for (const o of originals) {
    const created = new Date((o.createdAt as Date).getTime() + between(10, 120) * 60_000);
    if (created.getTime() > now) continue;
    const [lng, lat] = (o.location as { coordinates: [number, number] }).coordinates;
    docs.push({
      ...o,
      _id: new Types.ObjectId(),
      reporter: pick(reporters)._id,
      location: { type: "Point", coordinates: [lng + gauss() * 0.0008, lat + gauss() * 0.0008] },
      status: "submitted",
      assignedNgo: undefined,
      acceptedAt: undefined,
      closedAt: undefined,
      statusHistory: [{ status: "submitted", note: "Report submitted", at: created }],
      duplicateOf: o._id,
      duplicateScore: Math.round(between(0.92, 0.98) * 1000) / 1000,
      escalationLevel: 0,
      createdAt: created,
      updatedAt: created,
    });
  }

  await RescueRequest.insertMany(docs, { ordered: false });
  return { requests: docs.length, ngos: ngos.length, reporters: reporters.length };
}
