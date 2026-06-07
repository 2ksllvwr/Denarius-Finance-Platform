import { Schema, model, Types, type InferSchemaType } from "mongoose";

const monthlyGoalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
    savingsTarget: { type: Number, default: 0, min: 0 },
    spendingLimit: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", maxlength: 1000 },
  },
  { timestamps: true },
);

monthlyGoalSchema.index({ userId: 1, month: 1 }, { unique: true });

export type MonthlyGoalDocument = InferSchemaType<typeof monthlyGoalSchema> & { _id: Types.ObjectId };
export const MonthlyGoalModel = model("MonthlyGoal", monthlyGoalSchema);
