import { Schema, model, Types, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    icon: { type: String, required: true, default: "📌" },
    color: { type: String, required: true, default: "#6366f1" },
    budget: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export type CategoryDocument = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId };
export const CategoryModel = model("Category", categorySchema);
