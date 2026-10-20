import { startSession } from "mongoose";
import { Ngo, type VerificationStatus } from "../models/Ngo";
import { RescueRequest } from "../models/RescueRequest";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { hashPassword } from "./auth.service";
import { adminIds, notify } from "./notification.service";

export interface NgoApplication {
  name: string;
  email: string;
  phone: string;
  password: string;
  address?: string;
  description?: string;
  registrationNumber?: string;
  lat: number;
  lng: number;
  serviceRadiusKm: number;
  specializations: string[];
  capacity: number;
}

export async function applyNgo(input: NgoApplication) {
  const email = input.email.toLowerCase();
  const [userExists, ngoExists] = await Promise.all([User.exists({ email }), Ngo.exists({ email })]);
  if (userExists || ngoExists) throw new AppError(409, "An account with this email already exists");

  const session = await startSession();
  try {
    let ngoId = "";
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: input.name,
            email,
            phone: input.phone,
            passwordHash: await hashPassword(input.password),
            authProvider: "password",
            role: "ngo",
          },
        ],
        { session },
      );
      const [ngo] = await Ngo.create(
        [
          {
            owner: user._id,
            name: input.name,
            email,
            phone: input.phone,
            address: input.address,
            description: input.description,
            registrationNumber: input.registrationNumber,
            location: { type: "Point", coordinates: [input.lng, input.lat] },
            serviceRadiusKm: input.serviceRadiusKm,
            specializations: input.specializations,
            capacity: input.capacity,
          },
        ],
        { session },
      );
      ngoId = ngo._id.toString();
    });
    void adminIds().then((ids) =>
      notify(ids, {
        type: "ngo_application",
        title: `New NGO application: ${input.name}`,
        body: input.address,
        link: "/dashboard/admin/ngos",
      }),
    );
    return ngoId;
  } finally {
    await session.endSession();
  }
}

export async function getNgoForOwner(ownerId: string) {
  const ngo = await Ngo.findOne({ owner: ownerId });
  if (!ngo) throw new AppError(404, "NGO profile not found");
  return ngo;
}

export function listNgos(status?: VerificationStatus) {
  return Ngo.find(status ? { verificationStatus: status } : {})
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
}

export async function reviewNgo(id: string, adminId: string, status: "approved" | "rejected", reason?: string) {
  const ngo = await Ngo.findById(id);
  if (!ngo) throw new AppError(404, "NGO not found");
  ngo.verificationStatus = status;
  ngo.rejectionReason = status === "rejected" ? reason : undefined;
  ngo.set("reviewedBy", adminId);
  ngo.reviewedAt = new Date();
  await ngo.save();
  void notify([ngo.owner], {
    type: "ngo_reviewed",
    title: status === "approved" ? "Your NGO is verified 🎉" : "Your NGO application was not approved",
    body: status === "approved" ? "You'll now receive nearby rescue requests." : reason,
    link: "/dashboard/ngo",
  });
  return ngo;
}

export async function listRequestsForAdmin(filter: "all" | "open" | "unassigned" | "escalated") {
  const q =
    filter === "open"
      ? { status: { $nin: ["recovered", "closed"] } }
      : filter === "unassigned"
        ? { status: "submitted", assignedNgo: null }
        : filter === "escalated"
          ? { escalationLevel: { $gt: 0 }, status: "submitted" }
          : {};
  return RescueRequest.find(q).sort({ isEmergency: -1, createdAt: -1 }).limit(200).populate("assignedNgo", "name").lean();
}
