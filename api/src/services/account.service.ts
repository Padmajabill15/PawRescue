import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";
import { env } from "../config/env";
import { Ngo, SPECIALIZATIONS } from "../models/Ngo";
import { Otp } from "../models/Otp";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { hashPassword } from "./auth.service";
import { sendMail } from "./mail.service";
import { adminIds, notify } from "./notification.service";

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;
const hashCode = (email: string, code: string) => createHash("sha256").update(`${email}:${code}:${env.JWT_SECRET}`).digest("hex");

export async function updateProfile(userId: string, input: { name?: string; phone?: string }) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !user.isActive) throw new AppError(404, "Account not found");
  if (input.name) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone || undefined;
  await user.save();
  return user;
}

export async function changePassword(userId: string, current: string | undefined, next: string) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !user.isActive) throw new AppError(404, "Account not found");
  if (user.passwordHash) {
    if (!current || !(await bcrypt.compare(current, user.passwordHash))) throw new AppError(400, "Current password is incorrect");
  }
  user.passwordHash = await hashPassword(next);
  await user.save();
}

/** Always resolves the same way so the response never reveals whether an email is registered. */
export async function requestPasswordReset(email: string) {
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select("_id");
  if (!user) return { devCode: undefined };
  const recent = await Otp.countDocuments({ email, createdAt: { $gte: new Date(Date.now() - 60_000) } });
  if (recent) throw new AppError(429, "A code was just sent. Please wait a minute before asking again.");

  const code = String(randomInt(100000, 1000000));
  await Otp.deleteMany({ email, purpose: "reset" });
  await Otp.create({ email, purpose: "reset", codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000) });
  const { delivered } = await sendMail(
    email,
    "Your PawRescue password reset code",
    `Your code is ${code}. It expires in ${OTP_TTL_MIN} minutes.\n\nIf you didn't ask to reset your password, you can ignore this email.`,
  );
  // Local development without an email provider: hand the code back so the flow can be tested
  return { devCode: !delivered && env.NODE_ENV !== "production" ? code : undefined };
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const otp = await Otp.findOne({ email: email.toLowerCase(), purpose: "reset" });
  if (!otp || otp.expiresAt < new Date()) throw new AppError(400, "This code has expired. Ask for a new one.");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await otp.deleteOne();
    throw new AppError(400, "Too many wrong attempts. Ask for a new code.");
  }
  if (otp.codeHash !== hashCode(otp.email, code)) {
    otp.attempts += 1;
    await otp.save();
    throw new AppError(400, `That code is incorrect. ${OTP_MAX_ATTEMPTS - otp.attempts} attempts left.`);
  }
  const user = await User.findOne({ email: otp.email, isActive: true }).select("+passwordHash");
  if (!user) throw new AppError(400, "Account not found");
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await otp.deleteOne();
}

export async function requestDeletion(userId: string, reason?: string) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) throw new AppError(404, "Account not found");
  if (user.role === "admin") throw new AppError(400, "Admin accounts can't be deleted from here");
  user.deletionRequest = { requestedAt: new Date(), reason };
  await user.save();
  await notify(await adminIds(), {
    type: "ngo_application",
    title: `${user.name} asked to delete their ${user.role === "ngo" ? "NGO " : ""}account`,
    body: reason,
    link: "/dashboard/admin/users?filter=deletion",
  });
  return user;
}

export async function cancelDeletion(userId: string) {
  await User.updateOne({ _id: userId }, { $unset: { deletionRequest: 1 } });
}

export function listUsers(filter: "all" | "user" | "ngo" | "deletion") {
  const q =
    filter === "deletion"
      ? { "deletionRequest.requestedAt": { $exists: true }, isActive: true }
      : filter === "all"
        ? { isActive: true }
        : { role: filter, isActive: true };
  return User.find({ ...q, email: { $not: /@demo\.pawrescue\.dev$/ } })
    .sort({ "deletionRequest.requestedAt": -1, createdAt: -1 })
    .limit(300)
    .select("name email phone role authProvider isEmergencyUser deletionRequest createdAt")
    .lean();
}

/** Approve: anonymise the account (reports stay for the animals' records, personal data goes). */
export async function approveDeletion(userId: string) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) throw new AppError(404, "Account not found");
  if (user.role === "admin") throw new AppError(400, "Admin accounts can't be deleted");
  if (user.role === "ngo") {
    await Ngo.updateOne(
      { owner: user._id },
      { verificationStatus: "rejected", rejectionReason: "Account deleted", email: `deleted-${user._id}@deleted.local`, phone: "-", description: "" },
    );
  }
  await User.updateOne(
    { _id: user._id },
    {
      $set: { name: "Deleted user", isActive: false, deletedAt: new Date() },
      $unset: { email: 1, phone: 1, googleId: 1, passwordHash: 1, avatar: 1, deletionRequest: 1 },
    },
  );
}

export const rejectDeletion = cancelDeletion;

export interface NgoUpdate {
  name?: string;
  phone?: string;
  address?: string;
  description?: string;
  serviceRadiusKm?: number;
  capacity?: number;
  specializations?: (typeof SPECIALIZATIONS)[number][];
  lat?: number;
  lng?: number;
}

export async function updateMyNgo(ownerId: string, u: NgoUpdate) {
  const ngo = await Ngo.findOne({ owner: ownerId });
  if (!ngo) throw new AppError(404, "NGO profile not found");
  const { lat, lng, ...rest } = u;
  Object.assign(ngo, Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)));
  if (lat !== undefined && lng !== undefined) ngo.location = { type: "Point", coordinates: [lng, lat] };
  await ngo.save();
  return ngo;
}
