import { Router } from "express";
import { apply, myNgo } from "../controllers/ngo.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.post("/apply", apply);
router.get("/me", requireAuth, requireRole("ngo"), myNgo);

export default router;
