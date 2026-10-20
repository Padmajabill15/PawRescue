import { Types } from "mongoose";
import { Notification, type NOTIFICATION_TYPES } from "../models/Notification";
import { User } from "../models/User";
import { emitToUsers } from "./realtime";

type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/** Persist one notification per recipient and push it live. Never throws. */
export async function notify(recipients: (string | Types.ObjectId)[], n: NotifyInput) {
  const ids = [...new Set(recipients.map(String))];
  if (!ids.length) return;
  try {
    const docs = await Notification.insertMany(ids.map((recipient) => ({ recipient, ...n })));
    for (const d of docs) emitToUsers([String(d.recipient)], "notification:new", d.toObject());
  } catch (err) {
    console.error("notify failed", err);
  }
}

export async function adminIds() {
  const admins = await User.find({ role: "admin", isActive: true }).select("_id").lean();
  return admins.map((a) => String(a._id));
}

export async function listNotifications(userId: string) {
  const [items, unread] = await Promise.all([
    Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(30).lean(),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);
  return { items, unread };
}

export const markRead = (userId: string, id: string) =>
  Notification.updateOne({ _id: id, recipient: userId }, { read: true });

export const markAllRead = (userId: string) =>
  Notification.updateMany({ recipient: userId, read: false }, { read: true });
