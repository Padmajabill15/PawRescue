import { Router } from "express";
import { updateNgo } from "../controllers/account.controller";
import { apply, myNgo } from "../controllers/ngo.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/apply", authLimiter, apply);
router.get("/me", requireAuth, requireRole("ngo"), myNgo);
router.patch("/me", requireAuth, requireRole("ngo"), updateNgo);

export default router;
