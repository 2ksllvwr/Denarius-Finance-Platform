import { Schema, model, Types, type InferSchemaType } from "mongoose";

const monthlyClosureSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    closedAt: { type: Date, required: true },
    income: { type: Number, default: 0 },
    expense: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    notes: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true },
);

monthlyClosureSchema.index({ userId: 1, month: 1 }, { unique: true });

export type MonthlyClosureDocument = InferSchemaType<typeof monthlyClosureSchema> & { _id: Types.ObjectId };
export const MonthlyClosureModel = model("MonthlyClosure", monthlyClosureSchema);
