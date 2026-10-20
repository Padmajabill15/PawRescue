import { HydratedDocument, InferSchemaType, model, Schema } from "mongoose";
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
export const SPECIES = ["dog", "cat", "cow", "bird", "monkey", "wildlife", "reptile", "other"] as const;
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

const aiSchema = new Schema(
  {
    species: { type: String },
    speciesConfidence: { type: Number },
    speciesTop: { type: [{ label: String, confidence: Number, _id: false }], default: undefined },
    injuryProbability: { type: Number },
    severityScore: { type: Number },
    reasons: { type: [String], default: undefined },
    source: { type: String, enum: ["model", "rules"], default: "rules" },
    model: { type: String },
    ms: { type: Number },
  },
  { _id: false },
);

const rescueRequestSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    images: { type: [String], default: [] },
    description: { type: String, trim: true },
    address: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    animalCount: { type: Number, default: 1, min: 1 },
    location: { type: geoPointSchema, required: true },
    species: { type: String, enum: SPECIES, default: "other" },
    severity: { type: String, enum: SEVERITIES, default: "medium" },
    isEmergency: { type: Boolean, default: false },
    status: { type: String, enum: REQUEST_STATUSES, default: "submitted", required: true },
    assignedNgo: { type: Schema.Types.ObjectId, ref: "Ngo" },
    statusHistory: { type: [statusHistorySchema], default: [] },
    duplicateOf: { type: Schema.Types.ObjectId, ref: "RescueRequest" },
    nearbyNgoCount: { type: Number, default: 0 },
    ai: { type: aiSchema },
    embedding: { type: [Number], select: false },
    duplicateScore: { type: Number },
    acceptedAt: { type: Date },
    closedAt: { type: Date },
    escalatedAt: { type: Date },
    escalationLevel: { type: Number, default: 0 },
  },
  { timestamps: true },
);

rescueRequestSchema.index({ location: "2dsphere" });
rescueRequestSchema.index({ status: 1, createdAt: -1 });
rescueRequestSchema.index({ reporter: 1 });
rescueRequestSchema.index({ assignedNgo: 1 });
rescueRequestSchema.index({ status: 1, escalationLevel: 1, createdAt: 1 });

export type IRescueRequest = InferSchemaType<typeof rescueRequestSchema>;
export type RescueRequestDoc = HydratedDocument<IRescueRequest>;
export const RescueRequest = model("RescueRequest", rescueRequestSchema);
