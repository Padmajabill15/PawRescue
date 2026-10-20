import { isValidObjectId } from "mongoose";
import { listNotifications, markAllRead, markRead } from "../services/notification.service";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await listNotifications(req.auth!.sub) });
});

export const readOne = asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  if (!isValidObjectId(id)) throw new AppError(400, "Invalid id");
  await markRead(req.auth!.sub, id);
  res.json({ success: true });
});

export const readAll = asyncHandler(async (req, res) => {
  await markAllRead(req.auth!.sub);
  res.json({ success: true });
});
