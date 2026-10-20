import { HydratedDocument, InferSchemaType, model, Schema } from "mongoose";

export const AUTH_PROVIDERS = ["google", "otp", "password", "guest"] as const;
export const ROLES = ["user", "ngo", "admin"] as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    phone: { type: String, trim: true, index: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    authProvider: { type: String, enum: AUTH_PROVIDERS, required: true },
    role: { type: String, enum: ROLES, default: "user", required: true },
    isEmergencyUser: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<IUser>;
export const User = model("User", userSchema);
