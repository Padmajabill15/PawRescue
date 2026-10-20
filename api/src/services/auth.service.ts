import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { Ngo } from "../models/Ngo";
import { User, type UserDoc } from "../models/User";
import { AppError } from "../utils/AppError";
import { signToken } from "../utils/jwt";

const googleClient = new OAuth2Client();

export function toPublicUser(user: UserDoc & { passwordHash?: string | null }) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    authProvider: user.authProvider,
    isEmergencyUser: user.isEmergencyUser,
    hasPassword: Boolean(user.passwordHash),
    deletionRequestedAt: user.deletionRequest?.requestedAt ?? null,
    createdAt: (user as unknown as { createdAt?: Date }).createdAt,
  };
}

export function issueToken(user: UserDoc) {
  return signToken({ sub: user._id.toString(), role: user.role, name: user.name });
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export async function registerUser(input: { name: string; email: string; phone?: string; password: string }) {
  const exists = await User.exists({ email: input.email.toLowerCase() });
  if (exists) throw new AppError(409, "An account with this email already exists");

  return User.create({
    name: input.name,
    email: input.email,
    phone: input.phone || undefined,
    passwordHash: await hashPassword(input.password),
    authProvider: "password",
    role: "user",
  });
}

export async function loginWithPassword(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password");
  }
  if (!user.isActive) throw new AppError(403, "This account has been disabled");

  if (user.role === "ngo") {
    const ngo = await Ngo.findOne({ owner: user._id }).select("verificationStatus rejectionReason");
    if (!ngo || ngo.verificationStatus === "pending") {
      throw new AppError(403, "Your NGO application is still pending admin approval");
    }
    if (ngo.verificationStatus === "rejected") {
      throw new AppError(
        403,
        `Your NGO application was rejected${ngo.rejectionReason ? `: ${ngo.rejectionReason}` : ""}`,
      );
    }
  }
  return user;
}

export async function loginWithGoogle(idToken: string, emergency: boolean) {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, "Google sign-in is not configured yet");

  const ticket = await googleClient
    .verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID })
    .catch(() => {
      throw new AppError(401, "Google sign-in failed, please try again");
    });
  const p = ticket.getPayload();
  if (!p?.sub || !p.email || !p.email_verified) throw new AppError(401, "Google account email is not verified");

  let user = await User.findOne({ $or: [{ googleId: p.sub }, { email: p.email.toLowerCase() }] });

  if (user && user.role !== "user") {
    throw new AppError(403, "This email belongs to an NGO/admin account. Please sign in with email and password.");
  }
  if (user && !user.isActive) throw new AppError(403, "This account has been disabled");

  if (!user) {
    user = await User.create({
      name: p.name ?? p.email.split("@")[0],
      email: p.email,
      googleId: p.sub,
      avatar: p.picture,
      authProvider: "google",
      role: "user",
      isEmergencyUser: emergency,
    });
  } else if (!user.googleId) {
    user.googleId = p.sub;
    user.avatar ??= p.picture;
    await user.save();
  }
  return user;
}

/** Emergency guest: name + phone only, no password. Each quick SOS gets its own account (no takeover by phone number). */
export function createGuest(name: string, phone: string) {
  return User.create({ name, phone, authProvider: "guest", role: "user", isEmergencyUser: true });
}

export async function ensureAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
  const exists = await User.exists({ role: "admin" });
  if (exists) return;
  await User.create({
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    passwordHash: await hashPassword(env.ADMIN_PASSWORD),
    authProvider: "password",
    role: "admin",
  });
  console.log(`Admin account created: ${env.ADMIN_EMAIL}`);
}
