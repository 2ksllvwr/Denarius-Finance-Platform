import { Schema, model, Types, type InferSchemaType } from "mongoose";

const recurringTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    dayOfMonth: { type: Number, required: true, min: 1, max: 31 },
    status: { type: String, enum: ["completed", "pending"], default: "completed" },
    active: { type: Boolean, default: true },
    lastGeneratedMonth: { type: String },
  },
  { timestamps: true },
);

recurringTransactionSchema.index({ userId: 1, active: 1 });

export type RecurringTransactionDocument = InferSchemaType<typeof recurringTransactionSchema> & { _id: Types.ObjectId };
export const RecurringTransactionModel = model("RecurringTransaction", recurringTransactionSchema);
