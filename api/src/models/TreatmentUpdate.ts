import { InferSchemaType, model, Schema } from "mongoose";

const treatmentUpdateSchema = new Schema(
  {
    request: { type: Schema.Types.ObjectId, ref: "RescueRequest", required: true, index: true },
    ngo: { type: Schema.Types.ObjectId, ref: "Ngo", required: true },
    notes: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type ITreatmentUpdate = InferSchemaType<typeof treatmentUpdateSchema>;
export const TreatmentUpdate = model("TreatmentUpdate", treatmentUpdateSchema);
