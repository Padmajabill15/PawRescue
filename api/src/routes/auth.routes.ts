import { Router } from "express";
import { google, login, logout, me, quickSos, register, socketToken } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, google);
router.post("/quick-sos", authLimiter, quickSos);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.get("/socket-token", requireAuth, socketToken);

export default router;
