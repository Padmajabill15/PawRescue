import { Types } from "mongoose";
import { env } from "../config/env";
import { Ngo } from "../models/Ngo";
import { RescueRequest, type RequestStatus, type RescueRequestDoc } from "../models/RescueRequest";
import { TreatmentUpdate } from "../models/TreatmentUpdate";
import type { Role } from "../models/User";
import { AppError } from "../utils/AppError";
import { cosine, type MlAnalysis } from "./ml.service";
import { adminIds, notify } from "./notification.service";
import { emitToAdmins, emitToUsers } from "./realtime";
import { triageSeverity } from "../utils/triage";

const point = (lng: number, lat: number) => ({ type: "Point" as const, coordinates: [lng, lat] as [number, number] });

/** Approved NGOs whose own service radius covers this point, nearest first. */
export function findMatchingNgos(lng: number, lat: number, maxKm = env.NGO_MATCH_MAX_KM, ignoreServiceRadius = false) {
  return Ngo.aggregate<{ _id: Types.ObjectId; owner: Types.ObjectId; name: string; distanceKm: number }>([
    {
      $geoNear: {
        near: point(lng, lat),
        distanceField: "distanceM",
        maxDistance: maxKm * 1000,
        query: { verificationStatus: "approved" },
        spherical: true,
      },
    },
    { $match: ignoreServiceRadius ? {} : { $expr: { $lte: ["$distanceM", { $multiply: ["$serviceRadiusKm", 1000] }] } } },
    { $project: { name: 1, owner: 1, distanceKm: { $round: [{ $divide: ["$distanceM", 1000] }, 1] } } },
  ]);
}

export interface NewRequest {
  reporter: string;
  description?: string;
  species: string;
  lat: number;
  lng: number;
  address?: string;
  contactPhone?: string;
  animalCount: number;
  isEmergency: boolean;
  images: string[];
  analysis: MlAnalysis | null;
}

const DUP_RADIUS_M = 500;
const DUP_WINDOW_H = 48;
const DUP_SIMILARITY = 0.9;

/** Same animal reported again? Nearby + recent + open + visually near-identical photo. */
async function findDuplicate(lng: number, lat: number, embedding: number[]) {
  const candidates = await RescueRequest.find({
    location: { $nearSphere: { $geometry: point(lng, lat), $maxDistance: DUP_RADIUS_M } },
    createdAt: { $gte: new Date(Date.now() - DUP_WINDOW_H * 3600_000) },
    status: { $nin: ["recovered", "closed"] },
    duplicateOf: null,
  })
    .select("+embedding assignedNgo location")
    .limit(20);
  let best: { doc: (typeof candidates)[number]; score: number } | null = null;
  for (const c of candidates) {
    if (!c.embedding?.length) continue;
    const score = cosine(embedding, c.embedding);
    if (score >= DUP_SIMILARITY && (!best || score > best.score)) best = { doc: c, score };
  }
  return best;
}

export async function createRequest(input: NewRequest) {
  const a = input.analysis;
  const [ngos, dup] = await Promise.all([
    findMatchingNgos(input.lng, input.lat),
    a?.embedding.length ? findDuplicate(input.lng, input.lat, a.embedding) : Promise.resolve(null),
  ]);
  const request = await RescueRequest.create({
    reporter: input.reporter,
    description: input.description,
    species: input.species,
    address: input.address,
    contactPhone: input.contactPhone,
    animalCount: input.animalCount,
    images: input.images,
    location: point(input.lng, input.lat),
    isEmergency: input.isEmergency,
    severity: a?.severity.level ?? triageSeverity(input.description, input.isEmergency),
    ai: a
      ? {
          source: "model",
          species: a.species.label,
          speciesConfidence: a.species.confidence,
          speciesTop: a.species.top,
          injuryProbability: a.injury.probability,
          severityScore: a.severity.score,
          reasons: a.severity.reasons,
          model: a.model,
          ms: a.ms,
        }
      : { source: "rules" },
    embedding: a?.embedding,
    duplicateOf: dup?.doc._id,
    duplicateScore: dup ? Math.round(dup.score * 1000) / 1000 : undefined,
    nearbyNgoCount: ngos.length,
    statusHistory: [{ status: "submitted", note: input.isEmergency ? "Emergency SOS raised" : "Report submitted" }],
  });
  if (dup) void announceDuplicate(request, dup.doc._id, ngos);
  else void announceNewRequest(request, ngos);
  return { request, nearestNgos: ngos.slice(0, 5).map(({ name, distanceKm }) => ({ name, distanceKm })) };
}

const STATUS_TEXT: Record<RequestStatus, string> = {
  submitted: "Submitted",
  accepted: "accepted your report",
  on_the_way: "is on the way",
  rescued: "has rescued the animal",
  treatment: "started treatment",
  recovered: "reports the animal has recovered 🎉",
  closed: "closed the case",
};

const shortText = (t?: string | null) => (t && t.length > 80 ? `${t.slice(0, 77)}…` : t ?? undefined);

async function announceNewRequest(request: RescueRequestDoc, ngos: { owner: Types.ObjectId; distanceKm: number }[]) {
  const id = request._id.toString();
  const payload = { id, status: request.status, isEmergency: request.isEmergency, severity: request.severity };
  emitToUsers(ngos.map((n) => String(n.owner)), "request:new", payload);
  emitToAdmins("request:new", payload);
  const what = `${request.species} · ${request.severity}`;
  await notify(
    ngos.map((n) => n.owner),
    {
      type: request.isEmergency ? "request_emergency" : "request_new",
      title: request.isEmergency ? `🚨 Emergency rescue nearby (${what})` : `New rescue request nearby (${what})`,
      body: shortText(request.description),
      link: `/dashboard/ngo/cases/${id}`,
    },
  );
  if (!ngos.length) {
    await notify(await adminIds(), {
      type: "request_escalated",
      title: `No NGO covers a new ${request.species} report`,
      body: shortText(request.address ?? request.description),
      link: `/dashboard/admin/requests/${id}`,
    });
  }
}

async function announceDuplicate(request: RescueRequestDoc, originalId: Types.ObjectId, ngos: { owner: Types.ObjectId }[]) {
  const original = await RescueRequest.findById(originalId).select("assignedNgo").populate<{ assignedNgo: { owner: Types.ObjectId } | null }>("assignedNgo", "owner");
  const recipients = original?.assignedNgo ? [original.assignedNgo.owner] : ngos.map((n) => n.owner);
  await notify(recipients, {
    type: "request_new",
    title: `Another person reported the same ${request.species}`,
    body: "Linked to the existing case automatically. No new rescue needed.",
    link: `/dashboard/ngo/cases/${originalId.toString()}`,
  });
  emitToAdmins("request:new", { id: request._id.toString(), duplicateOf: originalId.toString() });
}

async function announceChange(request: RescueRequestDoc, ngoName: string, n: { type: "request_accepted" | "request_status" | "treatment_update"; title: string; body?: string }) {
  const id = request._id.toString();
  const payload = { id, status: request.status };
  const reporter = String(request.reporter);
  // People whose report was merged into this one follow its progress too
  const dups = await RescueRequest.find({ duplicateOf: request._id }).select("reporter").lean();
  const followers = [...new Set(dups.map((d) => String(d.reporter)).filter((r) => r !== reporter))];
  emitToUsers([reporter, ...followers], "request:updated", payload);
  emitToAdmins("request:updated", payload);
  await notify([reporter], { ...n, title: `${ngoName} ${n.title}`, link: `/dashboard/user/reports/${id}` });
  for (const d of dups) {
    if (String(d.reporter) === reporter) continue;
    await notify([d.reporter], { ...n, title: `${ngoName} ${n.title}`, link: `/dashboard/user/reports/${String(d._id)}` });
  }
}

export function listMyRequests(reporter: string) {
  return RescueRequest.find({ reporter })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("assignedNgo", "name phone")
    .lean();
}

async function ngoIdFor(ownerId: string) {
  const ngo = await Ngo.findOne({ owner: ownerId, verificationStatus: "approved" }).select("name location serviceRadiusKm");
  if (!ngo) throw new AppError(403, "Your NGO is not approved");
  return ngo;
}

export async function getRequestDetail(id: string, viewer: { sub: string; role: Role }) {
  const request = await RescueRequest.findById(id)
    .populate("assignedNgo", "name phone email address location")
    .populate("reporter", "name phone email")
    .populate({ path: "duplicateOf", select: "status assignedNgo createdAt", populate: { path: "assignedNgo", select: "name phone" } })
    .lean();
  if (!request) throw new AppError(404, "Request not found");

  const reporterId = String((request.reporter as unknown as { _id: Types.ObjectId })?._id ?? request.reporter);
  if (viewer.role === "user" && reporterId !== viewer.sub) throw new AppError(404, "Request not found");
  if (viewer.role === "ngo") {
    const ngo = await ngoIdFor(viewer.sub);
    const assigned = (request.assignedNgo as unknown as { _id: Types.ObjectId } | null)?._id;
    if (assigned && !assigned.equals(ngo._id)) throw new AppError(404, "Request not found");
  }

  const updates = await TreatmentUpdate.find({ request: id }).sort({ createdAt: -1 }).lean();
  return { ...request, updates };
}

/** Open requests inside this NGO's service radius, nearest first. */
export async function nearbyForNgo(ownerId: string) {
  const ngo = await ngoIdFor(ownerId);
  const [lng, lat] = ngo.location.coordinates;
  return RescueRequest.aggregate([
    {
      $geoNear: {
        near: point(lng, lat),
        distanceField: "distanceM",
        maxDistance: ngo.serviceRadiusKm * 1000,
        query: { status: "submitted", assignedNgo: null, duplicateOf: null, isDemo: { $ne: true } },
        spherical: true,
      },
    },
    { $addFields: { distanceKm: { $round: [{ $divide: ["$distanceM", 1000] }, 1] } } },
    { $limit: 100 },
  ]);
}

export async function casesForNgo(ownerId: string) {
  const ngo = await ngoIdFor(ownerId);
  return RescueRequest.find({ assignedNgo: ngo._id }).sort({ updatedAt: -1 }).limit(200).lean();
}

export async function acceptRequest(id: string, ownerId: string) {
  const ngo = await ngoIdFor(ownerId);
  const updated = await RescueRequest.findOneAndUpdate(
    { _id: id, status: "submitted", assignedNgo: null },
    {
      $set: { status: "accepted", assignedNgo: ngo._id, acceptedAt: new Date() },
      $push: { statusHistory: { status: "accepted", note: "NGO accepted the rescue", at: new Date() } },
    },
    { new: true },
  );
  if (!updated) throw new AppError(409, "This request has already been accepted");

  const [lng, lat] = updated.location.coordinates;
  const others = await findMatchingNgos(lng, lat, env.NGO_MATCH_MAX_KM, true);
  emitToUsers(others.map((o) => String(o.owner)).filter((o) => o !== ownerId), "request:taken", { id });
  void announceChange(updated, ngo.name, { type: "request_accepted", title: STATUS_TEXT.accepted, body: "They'll keep you posted here." });
  return updated;
}

const FLOW: RequestStatus[] = ["accepted", "on_the_way", "rescued", "treatment", "recovered", "closed"];

export async function advanceStatus(id: string, ownerId: string, status: RequestStatus, note?: string) {
  const ngo = await ngoIdFor(ownerId);
  const request = await RescueRequest.findOne({ _id: id, assignedNgo: ngo._id });
  if (!request) throw new AppError(404, "Case not found");

  const from = FLOW.indexOf(request.status as RequestStatus);
  const to = FLOW.indexOf(status);
  if (to <= from) throw new AppError(400, `Can't move a case from "${request.status}" back to "${status}"`);

  request.status = status;
  request.statusHistory.push({ status, note, at: new Date() });
  if (status === "closed" || status === "recovered") request.closedAt ??= new Date();
  await request.save();
  void announceChange(request, ngo.name, { type: "request_status", title: STATUS_TEXT[status], body: note });
  return request;
}

export async function addTreatmentUpdate(id: string, ownerId: string, notes: string, images: string[]) {
  const ngo = await ngoIdFor(ownerId);
  const request = await RescueRequest.findOne({ _id: id, assignedNgo: ngo._id });
  if (!request) throw new AppError(404, "Case not found");
  const update = await TreatmentUpdate.create({ request: id, ngo: ngo._id, notes, images });
  void announceChange(request, ngo.name, { type: "treatment_update", title: "posted a treatment update", body: shortText(notes) });
  return update;
}
