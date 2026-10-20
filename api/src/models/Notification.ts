import { InferSchemaType, model, Schema } from "mongoose";

export const NOTIFICATION_TYPES = [
  "request_new",
  "request_emergency",
  "request_accepted",
  "request_status",
  "treatment_update",
  "request_escalated",
  "ngo_application",
  "ngo_reviewed",
] as const;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
// Auto-delete after 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });

export type INotification = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema);
