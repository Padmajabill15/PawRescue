import type { RequestHandler } from "express";
import type { Role } from "../models/User";
import { AppError } from "../utils/AppError";
import { AUTH_COOKIE, type TokenPayload, verifyToken } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token =
    (req.cookies?.[AUTH_COOKIE] as string | undefined) ??
    (header?.startsWith("Bearer ") ? header.slice(7) : undefined);

  if (!token) return next(new AppError(401, "Please sign in"));
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    next(new AppError(401, "Session expired, please sign in again"));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, "Please sign in"));
    if (!roles.includes(req.auth.role)) return next(new AppError(403, "You don't have access to this"));
    next();
  };
