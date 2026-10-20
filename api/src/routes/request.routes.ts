import { Router } from "express";
import {
  accept,
  cases,
  create,
  detail,
  mine,
  nearby,
  postUpdate,
  setStatus,
} from "../controllers/request.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { reportLimiter } from "../middleware/rateLimit";
import { imageUpload } from "../services/upload.service";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("user"), reportLimiter, imageUpload.array("images", 5), create);
router.get("/mine", requireRole("user"), mine);
router.get("/nearby", requireRole("ngo"), nearby);
router.get("/cases", requireRole("ngo"), cases);
router.get("/:id", detail);
router.patch("/:id/accept", requireRole("ngo"), accept);
router.patch("/:id/status", requireRole("ngo"), setStatus);
router.post("/:id/updates", requireRole("ngo"), imageUpload.array("images", 5), postUpdate);

export default router;
