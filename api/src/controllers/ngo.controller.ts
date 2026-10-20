import { z } from "zod";
import { SPECIALIZATIONS } from "../models/Ngo";
import { applyNgo, getNgoForOwner } from "../services/ngo.service";
import { asyncHandler } from "../utils/asyncHandler";

const applySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  address: z.string().trim().max(300).optional(),
  description: z.string().trim().max(1000).optional(),
  registrationNumber: z.string().trim().max(60).optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  serviceRadiusKm: z.coerce.number().min(1).max(200).default(10),
  specializations: z.array(z.enum(SPECIALIZATIONS)).default([]),
  capacity: z.coerce.number().int().min(0).max(10000).default(0),
});

export const apply = asyncHandler(async (req, res) => {
  const id = await applyNgo(applySchema.parse(req.body));
  res.status(201).json({
    success: true,
    data: { id },
    message: "Application submitted. You can sign in once an admin approves it.",
  });
});

export const myNgo = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getNgoForOwner(req.auth!.sub) });
});
