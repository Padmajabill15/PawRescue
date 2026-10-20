import { Router } from "express";
import { adminDeletion, adminUsers } from "../controllers/account.controller";
import { analytics, analyticsCsv, demoData, ngos, requests, review, stats } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/stats", stats);
router.get("/ngos", ngos);
router.patch("/ngos/:id/status", review);
router.get("/requests", requests);
router.get("/analytics", analytics);
router.get("/analytics/export.csv", analyticsCsv);
router.post("/demo-data", demoData);
router.get("/users", adminUsers);
router.post("/users/:id/deletion", adminDeletion);

export default router;
