import { Types } from "mongoose";
import { env } from "../config/env";
import { Ngo } from "../models/Ngo";
import { RescueRequest, type RequestStatus } from "../models/RescueRequest";
import { TreatmentUpdate } from "../models/TreatmentUpdate";
import type { Role } from "../models/User";
import { AppError } from "../utils/AppError";
import { triageSeverity } from "../utils/triage";

const point = (lng: number, lat: number) => ({ type: "Point" as const, coordinates: [lng, lat] as [number, number] });

/** Approved NGOs whose own service radius covers this point, nearest first. */
export function findMatchingNgos(lng: number, lat: number) {
  return Ngo.aggregate<{ _id: Types.ObjectId; name: string; distanceKm: number }>([
    {
      $geoNear: {
        near: point(lng, lat),
        distanceField: "distanceM",
        maxDistance: env.NGO_MATCH_MAX_KM * 1000,
        query: { verificationStatus: "approved" },
        spherical: true,
      },
    },
    { $match: { $expr: { $lte: ["$distanceM", { $multiply: ["$serviceRadiusKm", 1000] }] } } },
    { $project: { name: 1, distanceKm: { $round: [{ $divide: ["$distanceM", 1000] }, 1] } } },
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
}

export async function createRequest(input: NewRequest) {
  const ngos = await findMatchingNgos(input.lng, input.lat);
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
    severity: triageSeverity(input.description, input.isEmergency),
    nearbyNgoCount: ngos.length,
    statusHistory: [{ status: "submitted", note: input.isEmergency ? "Emergency SOS raised" : "Report submitted" }],
  });
  return { request, nearestNgos: ngos.slice(0, 5) };
}

export function listMyRequests(reporter: string) {
  return RescueRequest.find({ reporter })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("assignedNgo", "name phone")
    .lean();
}

async function ngoIdFor(ownerId: string) {
  const ngo = await Ngo.findOne({ owner: ownerId, verificationStatus: "approved" }).select("location serviceRadiusKm");
  if (!ngo) throw new AppError(403, "Your NGO is not approved");
  return ngo;
}

export async function getRequestDetail(id: string, viewer: { sub: string; role: Role }) {
  const request = await RescueRequest.findById(id)
    .populate("assignedNgo", "name phone email address location")
    .populate("reporter", "name phone email")
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
        query: { status: "submitted", assignedNgo: null, duplicateOf: null },
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
  if (!updated) throw new AppError(409, "This request was already accepted by another NGO");
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
  return request;
}

export async function addTreatmentUpdate(id: string, ownerId: string, notes: string, images: string[]) {
  const ngo = await ngoIdFor(ownerId);
  const exists = await RescueRequest.exists({ _id: id, assignedNgo: ngo._id });
  if (!exists) throw new AppError(404, "Case not found");
  return TreatmentUpdate.create({ request: id, ngo: ngo._id, notes, images });
}
