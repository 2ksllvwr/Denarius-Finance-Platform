import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { MonthlyClosureModel } from "../models/MonthlyClosure";
import { MonthlyGoalModel } from "../models/MonthlyGoal";

const router = Router();
router.use(requireAuth);

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/);

const goalSchema = z.object({
  savingsTarget: z.coerce.number().min(0).default(0),
  spendingLimit: z.coerce.number().min(0).default(0),
  notes: z.string().trim().max(1000).default(""),
});

const closureSchema = z.object({
  closedAt: z.string().datetime().optional(),
  income: z.coerce.number().default(0),
  expense: z.coerce.number().default(0),
  balance: z.coerce.number().default(0),
  pending: z.coerce.number().default(0),
  transactionCount: z.coerce.number().int().min(0).default(0),
  notes: z.string().trim().max(1000).default(""),
});

function serializeGoal(goal: Awaited<ReturnType<typeof MonthlyGoalModel.findOne>>) {
  if (!goal) return null;
  return {
    month: goal.month,
    savingsTarget: goal.savingsTarget,
    spendingLimit: goal.spendingLimit,
    notes: goal.notes,
    updatedAt: goal.updatedAt.toISOString(),
  };
}

function serializeClosure(closure: Awaited<ReturnType<typeof MonthlyClosureModel.findOne>>) {
  if (!closure) return null;
  return {
    month: closure.month,
    closedAt: closure.closedAt.toISOString(),
    income: closure.income,
    expense: closure.expense,
    balance: closure.balance,
    pending: closure.pending,
    transactionCount: closure.transactionCount,
    notes: closure.notes,
  };
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const month = typeof req.query.month === "string" ? monthSchema.parse(req.query.month) : undefined;
    const filter = month ? { userId: req.userId, month } : { userId: req.userId };
    const [goals, closures] = await Promise.all([
      MonthlyGoalModel.find(filter).sort({ month: -1 }).limit(36),
      MonthlyClosureModel.find(filter).sort({ month: -1 }).limit(36),
    ]);

    res.json({
      goals: goals.map(goal => serializeGoal(goal)),
      closures: closures.map(closure => serializeClosure(closure)),
    });
  } catch (error) {
    next(error);
  }
});

router.put("/goals/:month", async (req: AuthRequest, res, next) => {
  try {
    const month = monthSchema.parse(req.params.month);
    const input = goalSchema.parse(req.body);
    const userId = new Types.ObjectId(req.userId as string);
    const goal = await MonthlyGoalModel.findOneAndUpdate(
      { userId, month },
      { $set: { ...input, userId, month } },
      { upsert: true, new: true, runValidators: true },
    );

    res.json({ goal: serializeGoal(goal) });
  } catch (error) {
    next(error);
  }
});

router.put("/closures/:month", async (req: AuthRequest, res, next) => {
  try {
    const month = monthSchema.parse(req.params.month);
    const input = closureSchema.parse(req.body);
    const userId = new Types.ObjectId(req.userId as string);
    const closure = await MonthlyClosureModel.findOneAndUpdate(
      { userId, month },
      { $set: { ...input, userId, month, closedAt: input.closedAt ? new Date(input.closedAt) : new Date() } },
      { upsert: true, new: true, runValidators: true },
    );

    res.json({ closure: serializeClosure(closure) });
  } catch (error) {
    next(error);
  }
});

router.delete("/closures/:month", async (req: AuthRequest, res, next) => {
  try {
    const month = monthSchema.parse(req.params.month);
    await MonthlyClosureModel.findOneAndDelete({ userId: req.userId, month });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
