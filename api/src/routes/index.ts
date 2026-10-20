import { Router } from "express";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import ngoRoutes from "./ngo.routes";
import requestRoutes from "./request.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/ngos", ngoRoutes);
router.use("/admin", adminRoutes);
router.use("/requests", requestRoutes);

export default router;
