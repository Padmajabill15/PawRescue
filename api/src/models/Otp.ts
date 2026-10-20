import { model, Schema } from "mongoose";

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    purpose: { type: String, enum: ["reset"], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model("Otp", otpSchema);
