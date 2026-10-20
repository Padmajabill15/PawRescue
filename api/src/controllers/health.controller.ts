import type { RequestHandler } from "express";
import { getHealth } from "../services/health.service";

export const health: RequestHandler = (_req, res) => {
  res.json({ success: true, data: getHealth() });
};
