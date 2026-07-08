import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    emailVerifiedAt: { type: Date },
    plan: { type: String, enum: ["Free", "Pro", "Business"], default: "Pro" },
    avatarUrl: { type: String, maxlength: 500_000 },
    title: { type: String, maxlength: 80 },
    phone: { type: String, maxlength: 30 },
    bio: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: unknown };
export const UserModel = model("User", userSchema);
