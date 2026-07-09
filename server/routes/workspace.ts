import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { WorkspaceModel } from "../models/Workspace.js";

const router = Router();
router.use(requireAuth);

const workspaceKeys = [
  "transactions",
  "deletedTransactions",
  "categories",
  "accounts",
  "settings",
  "notifications",
  "monthlyGoals",
  "monthlyClosures",
  "recurringTransactions",
  "backupSnapshots",
] as const;

const workspacePatchSchema = z.object({
  transactions: z.array(z.unknown()).optional(),
  deletedTransactions: z.array(z.unknown()).optional(),
  categories: z.array(z.unknown()).optional(),
  accounts: z.array(z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  notifications: z.array(z.unknown()).optional(),
  monthlyGoals: z.array(z.unknown()).optional(),
  monthlyClosures: z.array(z.unknown()).optional(),
  recurringTransactions: z.array(z.unknown()).optional(),
  backupSnapshots: z.array(z.unknown()).optional(),
}).strict();

function serializeWorkspace(workspace: Awaited<ReturnType<typeof WorkspaceModel.findOne>>) {
  const source = (workspace?.toObject() ?? {}) as Record<string, unknown>;
  return Object.fromEntries(workspaceKeys.map(key => [key, source[key] ?? (key === "settings" ? {} : [])]));
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const workspace = await WorkspaceModel.findOneAndUpdate(
      { userId: req.userId },
      { $setOnInsert: { userId: req.userId } },
      { upsert: true, new: true },
    );
    res.json({ workspace: serializeWorkspace(workspace) });
  } catch (error) {
    next(error);
  }
});

router.patch("/", async (req: AuthRequest, res, next) => {
  try {
    const input = workspacePatchSchema.parse(req.body);
    const workspace = await WorkspaceModel.findOneAndUpdate(
      { userId: req.userId },
      { $set: input, $setOnInsert: { userId: req.userId } },
      { upsert: true, new: true, runValidators: true },
    );
    res.json({ workspace: serializeWorkspace(workspace) });
  } catch (error) {
    next(error);
  }
});

export default router;
