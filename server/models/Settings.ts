import { Schema, model, Types, type InferSchemaType } from "mongoose";

const settingsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    notifEmail: { type: Boolean, default: true },
    notifBudget: { type: Boolean, default: true },
    currency: { type: String, default: "BRL" },
  },
  { timestamps: true },
);

export type SettingsDocument = InferSchemaType<typeof settingsSchema> & { _id: Types.ObjectId };
export const SettingsModel = model("Settings", settingsSchema);
