import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { VERIFICATION_STATUSES } from "../models/Ngo";
import { getAdminStats } from "../services/admin.service";
import { listNgos, reviewNgo } from "../services/ngo.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const listQuery = z.object({ status: z.enum(VERIFICATION_STATUSES).optional() });
const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(300).optional(),
});

export const stats = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await getAdminStats() });
});

export const ngos = asyncHandler(async (req, res) => {
  const { status } = listQuery.parse(req.query);
  res.json({ success: true, data: await listNgos(status) });
});

export const review = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  if (!isValidObjectId(id)) throw new AppError(400, "Invalid NGO id");
  const { status, reason } = reviewSchema.parse(req.body);
  res.json({ success: true, data: await reviewNgo(id, req.auth!.sub, status, reason) });
});
