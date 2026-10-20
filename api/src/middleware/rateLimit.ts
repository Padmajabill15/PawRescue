import type { RequestHandler } from "express";
import { AppError } from "../utils/AppError";

/** Small in-memory fixed-window limiter (per IP + route group). Fine for a single API instance. */
export function rateLimit(name: string, max: number, windowMs: number): RequestHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.reset - now) / 1000));
      return next(new AppError(429, "Too many attempts. Please wait a few minutes and try again."));
    }
    next();
  };
}

export const authLimiter = rateLimit("auth", 20, 15 * 60_000);
export const reportLimiter = rateLimit("report", 10, 10 * 60_000);
export const apiLimiter = rateLimit("api", 600, 60_000);
