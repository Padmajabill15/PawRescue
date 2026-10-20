import type { Request } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { REQUEST_STATUSES, SPECIES } from "../models/RescueRequest";
import {
  acceptRequest,
  addTreatmentUpdate,
  advanceStatus,
  casesForNgo,
  createRequest,
  getRequestDetail,
  listMyRequests,
  nearbyForNgo,
} from "../services/request.service";
import { analyzeReport, mlHealth, suggestSpecies } from "../services/ml.service";
import { saveImages } from "../services/upload.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

const createSchema = z.object({
  description: z.string().trim().max(1000).optional(),
  species: z.enum(SPECIES).default("other"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  address: z.string().trim().max(300).optional(),
  contactPhone: z.string().trim().max(20).optional(),
  animalCount: z.coerce.number().int().min(1).max(50).default(1),
  isEmergency: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true")
    .default(false),
});

const statusSchema = z.object({
  status: z.enum(REQUEST_STATUSES),
  note: z.string().trim().max(500).optional(),
});

const updateSchema = z.object({ notes: z.string().trim().min(2).max(2000) });

const idParam = (req: Request) => {
  const id = String(req.params.id);
  if (!isValidObjectId(id)) throw new AppError(400, "Invalid id");
  return id;
};

export const create = asyncHandler(async (req, res) => {
  const body = createSchema.parse(req.body);
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new AppError(400, "Please add at least one photo of the animal");
  const [images, analysis] = await Promise.all([
    saveImages(files, "requests"),
    analyzeReport(files, body.description, body.isEmergency),
  ]);
  const result = await createRequest({ ...body, reporter: req.auth!.sub, images, analysis });
  res.status(201).json({ success: true, data: result });
});

export const mine = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listMyRequests(req.auth!.sub) });
});

export const detail = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getRequestDetail(idParam(req), req.auth!) });
});

export const nearby = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await nearbyForNgo(req.auth!.sub) });
});

export const cases = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await casesForNgo(req.auth!.sub) });
});

export const accept = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await acceptRequest(idParam(req), req.auth!.sub) });
});

export const setStatus = asyncHandler(async (req, res) => {
  const { status, note } = statusSchema.parse(req.body);
  res.json({ success: true, data: await advanceStatus(idParam(req), req.auth!.sub, status, note) });
});

export const postUpdate = asyncHandler(async (req, res) => {
  const id = idParam(req);
  const { notes } = updateSchema.parse(req.body);
  const images = await saveImages(req.files as Express.Multer.File[] | undefined, "updates");
  res.status(201).json({ success: true, data: await addTreatmentUpdate(id, req.auth!.sub, notes, images) });
});

export const aiSpecies = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, "Please attach a photo");
  const result = await suggestSpecies(req.file);
  res.json({ success: true, data: result ?? { top: [] } });
});

export const aiHealth = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: await mlHealth() });
});
