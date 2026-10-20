import { Router } from "express";
import { list, readAll, readOne } from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.get("/", list);
router.patch("/read-all", readAll);
router.patch("/:id/read", readOne);

export default router;
