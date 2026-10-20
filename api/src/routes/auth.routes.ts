import { Router } from "express";
import { google, login, logout, me, register } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", google);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
