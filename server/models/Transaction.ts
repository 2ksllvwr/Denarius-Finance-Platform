import { Schema, model, Types, type InferSchemaType } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ["income", "expense"], required: true, index: true },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ["completed", "pending"], default: "completed" },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

export type TransactionDocument = InferSchemaType<typeof transactionSchema> & { _id: Types.ObjectId };
export const TransactionModel = model("Transaction", transactionSchema);
