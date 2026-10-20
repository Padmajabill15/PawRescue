import { Router } from "express";
import { ngos, review, stats } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/stats", stats);
router.get("/ngos", ngos);
router.patch("/ngos/:id/status", review);

export default router;
