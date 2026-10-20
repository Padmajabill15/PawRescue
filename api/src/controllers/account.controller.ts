import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { SPECIALIZATIONS } from "../models/Ngo";
import {
  approveDeletion,
  cancelDeletion,
  changePassword,
  listUsers,
  rejectDeletion,
  requestDeletion,
  requestPasswordReset,
  resetPassword,
  updateMyNgo,
  updateProfile,
} from "../services/account.service";
import { toPublicUser } from "../services/auth.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const password = z.string().min(8, "Password must be at least 8 characters").max(100);
const phone = z.string().trim().regex(/^$|^[+]?[0-9][0-9 -]{6,15}$/, "Please enter a valid phone number");

export const updateMe = asyncHandler(async (req, res) => {
  const body = z.object({ name: z.string().trim().min(2).max(80).optional(), phone: phone.optional() }).parse(req.body);
  const user = await updateProfile(req.auth!.sub, { ...body, phone: body.phone?.replace(/[ -]/g, "") });
  res.json({ success: true, data: { user: toPublicUser(user) } });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = z.object({ currentPassword: z.string().optional(), newPassword: password }).parse(req.body);
  await changePassword(req.auth!.sub, currentPassword, newPassword);
  res.json({ success: true, message: "Password updated" });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
  const { devCode } = await requestPasswordReset(email);
  res.json({ success: true, message: "If that email has an account, a 6-digit code is on its way.", ...(devCode && { data: { devCode } }) });
});

export const resetWithCode = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = z
    .object({ email: z.string().trim().toLowerCase().email(), code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"), newPassword: password })
    .parse(req.body);
  await resetPassword(email, code, newPassword);
  res.json({ success: true, message: "Password reset. You can sign in now." });
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().max(300).optional() }).parse(req.body ?? {});
  await requestDeletion(req.auth!.sub, reason);
  res.json({ success: true, message: "Deletion requested. An admin will review it." });
});

export const deleteCancel = asyncHandler(async (req, res) => {
  await cancelDeletion(req.auth!.sub);
  res.json({ success: true });
});

export const updateNgo = asyncHandler(async (req, res) => {
  const body = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      phone: z.string().trim().min(7).max(20).optional(),
      address: z.string().trim().max(300).optional(),
      description: z.string().trim().max(1000).optional(),
      serviceRadiusKm: z.coerce.number().min(1).max(200).optional(),
      capacity: z.coerce.number().int().min(0).max(10000).optional(),
      specializations: z.array(z.enum(SPECIALIZATIONS)).optional(),
      lat: z.coerce.number().min(-90).max(90).optional(),
      lng: z.coerce.number().min(-180).max(180).optional(),
    })
    .parse(req.body);
  res.json({ success: true, data: await updateMyNgo(req.auth!.sub, body) });
});

export const adminUsers = asyncHandler(async (req, res) => {
  const { filter } = z.object({ filter: z.enum(["all", "user", "ngo", "deletion"]).default("all") }).parse(req.query);
  res.json({ success: true, data: await listUsers(filter) });
});

export const adminDeletion = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  if (!isValidObjectId(id)) throw new AppError(400, "Invalid id");
  const { action } = z.object({ action: z.enum(["approve", "reject"]) }).parse(req.body);
  if (id === req.auth!.sub) throw new AppError(400, "You can't delete your own admin account");
  await (action === "approve" ? approveDeletion(id) : rejectDeletion(id));
  res.json({ success: true });
});
