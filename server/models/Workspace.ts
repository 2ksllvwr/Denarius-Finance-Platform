import { Schema, model, Types, type InferSchemaType } from "mongoose";

const workspaceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    transactions: { type: [Schema.Types.Mixed], default: [] },
    deletedTransactions: { type: [Schema.Types.Mixed], default: [] },
    categories: { type: [Schema.Types.Mixed], default: [] },
    accounts: { type: [Schema.Types.Mixed], default: [] },
    settings: { type: Schema.Types.Mixed, default: {} },
    notifications: { type: [Schema.Types.Mixed], default: [] },
    monthlyGoals: { type: [Schema.Types.Mixed], default: [] },
    monthlyClosures: { type: [Schema.Types.Mixed], default: [] },
    recurringTransactions: { type: [Schema.Types.Mixed], default: [] },
    backupSnapshots: { type: [Schema.Types.Mixed], default: [] },
    debtAllocations: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, minimize: false },
);

export type WorkspaceDocument = InferSchemaType<typeof workspaceSchema> & { _id: Types.ObjectId };
export const WorkspaceModel = model("Workspace", workspaceSchema);
