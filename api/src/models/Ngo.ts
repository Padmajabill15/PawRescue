import { HydratedDocument, InferSchemaType, model, Schema } from "mongoose";
import { geoPointSchema } from "./geoPoint";

export const VERIFICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const SPECIALIZATIONS = ["dogs", "cats", "cattle", "birds", "wildlife", "reptiles", "other"] as const;

const ngoSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    description: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    documents: { type: [String], default: [] },
    verificationStatus: {
      type: String,
      enum: VERIFICATION_STATUSES,
      default: "pending",
      required: true,
    },
    rejectionReason: { type: String, trim: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    location: { type: geoPointSchema, required: true },
    serviceRadiusKm: { type: Number, default: 10, min: 0 },
    specializations: { type: [String], enum: SPECIALIZATIONS, default: [] },
    capacity: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true },
);

ngoSchema.index({ location: "2dsphere" });
ngoSchema.index({ verificationStatus: 1 });

export type INgo = InferSchemaType<typeof ngoSchema>;
export type NgoDoc = HydratedDocument<INgo>;
export const Ngo = model("Ngo", ngoSchema);
