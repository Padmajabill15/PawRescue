import { Router } from "express";
import { google, login, logout, me, quickSos, register, socketToken } from "../controllers/auth.controller";
import { changeMyPassword, deleteCancel, deleteRequest, forgotPassword, resetWithCode, updateMe } from "../controllers/account.controller";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, google);
router.post("/quick-sos", authLimiter, quickSos);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateMe);
router.post("/change-password", requireAuth, authLimiter, changeMyPassword);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetWithCode);
router.post("/delete-request", requireAuth, deleteRequest);
router.delete("/delete-request", requireAuth, deleteCancel);
router.get("/socket-token", requireAuth, socketToken);

export default router;
