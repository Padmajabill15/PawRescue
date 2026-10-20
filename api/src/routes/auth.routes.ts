import { Router } from "express";
import { google, login, logout, me, register, socketToken } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", google);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.get("/socket-token", requireAuth, socketToken);

export default router;
