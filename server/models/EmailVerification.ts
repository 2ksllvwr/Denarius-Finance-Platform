import { Schema, model, type InferSchemaType } from "mongoose";

const emailVerificationSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ["register", "reset"], required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

emailVerificationSchema.index({ email: 1, purpose: 1 }, { unique: true });

export type EmailVerificationDocument = InferSchemaType<typeof emailVerificationSchema>;
export const EmailVerificationModel = model("EmailVerification", emailVerificationSchema);
