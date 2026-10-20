import { Router } from "express";
import { Ngo } from "../models/Ngo";
import { RescueRequest } from "../models/RescueRequest";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
let cache: { at: number; data: unknown } | null = null;

/** Real (non-demo) platform numbers for the landing page, cached for 60 s. */
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    if (!cache || Date.now() - cache.at > 60_000) {
      const real = { isDemo: { $ne: true }, duplicateOf: null };
      const [reported, rescued, ngos] = await Promise.all([
        RescueRequest.countDocuments(real),
        RescueRequest.countDocuments({ ...real, "statusHistory.status": "rescued" }),
        Ngo.countDocuments({ verificationStatus: "approved", email: { $not: /@demo\.pawrescue\.dev$/ } }),
      ]);
      cache = { at: Date.now(), data: { reported, rescued, ngos } };
    }
    res.json({ success: true, data: cache.data });
  }),
);

export default router;
