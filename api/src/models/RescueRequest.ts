import { InferSchemaType, model, Schema } from "mongoose";
import { geoPointSchema } from "./geoPoint";

export const REQUEST_STATUSES = [
  "submitted",
  "accepted",
  "on_the_way",
  "rescued",
  "treatment",
  "recovered",
  "closed",
] as const;
export const SEVERITIES = ["low", "medium", "high", "critical"] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type Severity = (typeof SEVERITIES)[number];

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: REQUEST_STATUSES, required: true },
    note: { type: String, trim: true },
    at: { type: Date, default: Date.now, required: true },
  },
  { _id: false },
);

const rescueRequestSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    images: { type: [String], default: [] },
    description: { type: String, trim: true },
    location: { type: geoPointSchema, required: true },
    species: { type: String, trim: true },
    severity: { type: String, enum: SEVERITIES, default: "medium" },
    isEmergency: { type: Boolean, default: false },
    status: { type: String, enum: REQUEST_STATUSES, default: "submitted", required: true },
    assignedNgo: { type: Schema.Types.ObjectId, ref: "Ngo" },
    statusHistory: { type: [statusHistorySchema], default: [] },
    duplicateOf: { type: Schema.Types.ObjectId, ref: "RescueRequest" },
  },
  { timestamps: true },
);

rescueRequestSchema.index({ location: "2dsphere" });
rescueRequestSchema.index({ status: 1, createdAt: -1 });
rescueRequestSchema.index({ reporter: 1 });
rescueRequestSchema.index({ assignedNgo: 1 });

export type IRescueRequest = InferSchemaType<typeof rescueRequestSchema>;
export const RescueRequest = model("RescueRequest", rescueRequestSchema);
