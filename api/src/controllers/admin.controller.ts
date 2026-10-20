import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { VERIFICATION_STATUSES } from "../models/Ngo";
import { env } from "../config/env";
import { getAdminStats } from "../services/admin.service";
import { exportCsv, getAnalytics } from "../services/analytics.service";
import { purgeDemo, seedDemo } from "../services/demo.service";
import { listNgos, listRequestsForAdmin, reviewNgo } from "../services/ngo.service";
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

const requestsQuery = z.object({ filter: z.enum(["all", "open", "unassigned", "escalated"]).default("all") });

export const requests = asyncHandler(async (req, res) => {
  const { filter } = requestsQuery.parse(req.query);
  res.json({ success: true, data: await listRequestsForAdmin(filter) });
});

const analyticsQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  demo: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
});

export const analytics = asyncHandler(async (req, res) => {
  const { days, demo } = analyticsQuery.parse(req.query);
  res.json({ success: true, data: await getAnalytics(days, demo) });
});

export const analyticsCsv = asyncHandler(async (req, res) => {
  const { days, demo } = analyticsQuery.parse(req.query);
  const csv = await exportCsv(days, demo);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="pawrescue-requests-${days}d.csv"`);
  res.send(csv);
});

const demoSchema = z.object({ action: z.enum(["seed", "purge"]) });

export const demoData = asyncHandler(async (req, res) => {
  if (!env.ALLOW_DEMO_DATA) throw new AppError(403, "Demo data is disabled on this server");
  const { action } = demoSchema.parse(req.body);
  res.json({ success: true, data: action === "seed" ? await seedDemo() : await purgeDemo() });
});
