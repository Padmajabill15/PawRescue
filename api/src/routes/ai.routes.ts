import { Router } from "express";
import { aiHealth, aiSpecies } from "../controllers/request.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { imageUpload } from "../services/upload.service";

const router = Router();

router.use(requireAuth);
router.get("/health", aiHealth);
router.post("/species", requireRole("user"), imageUpload.single("image"), aiSpecies);

export default router;
