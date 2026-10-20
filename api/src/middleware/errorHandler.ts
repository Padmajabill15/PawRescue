import type { ErrorRequestHandler, RequestHandler } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "Each photo must be under 5 MB" : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE" ? "You can upload up to 5 photos" : err.message;
    res.status(400).json({ success: false, message: msg });
    return;
  }

  if ((err as { code?: number }).code === 11000) {
    const field = Object.keys((err as { keyPattern?: object }).keyPattern ?? {})[0] ?? "value";
    res.status(409).json({ success: false, message: `An account with this ${field} already exists` });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined && { errors: err.details }),
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(env.NODE_ENV !== "production" && { stack: err instanceof Error ? err.stack : String(err) }),
  });
};
