import { Router } from "express";
import { apply, myNgo } from "../controllers/ngo.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/apply", authLimiter, apply);
router.get("/me", requireAuth, requireRole("ngo"), myNgo);

export default router;
