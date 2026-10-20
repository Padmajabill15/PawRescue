import type { CookieOptions, Response } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { User, type UserDoc } from "../models/User";
import {
  issueToken,
  loginWithGoogle,
  loginWithPassword,
  registerUser,
  toPublicUser,
} from "../services/auth.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { AUTH_COOKIE } from "../utils/jwt";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function sendSession(res: Response, user: UserDoc, status = 200) {
  res.cookie(AUTH_COOKIE, issueToken(user), cookieOptions);
  res.status(status).json({ success: true, data: { user: toPublicUser(user) } });
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  credential: z.string().min(10),
  emergency: z.boolean().optional().default(false),
});

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(registerSchema.parse(req.body));
  sendSession(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  sendSession(res, await loginWithPassword(email, password));
});

export const google = asyncHandler(async (req, res) => {
  const { credential, emergency } = googleSchema.parse(req.body);
  sendSession(res, await loginWithGoogle(credential, emergency));
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth!.sub);
  if (!user || !user.isActive) throw new AppError(401, "Please sign in");
  res.json({ success: true, data: { user: toPublicUser(user) } });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
});
