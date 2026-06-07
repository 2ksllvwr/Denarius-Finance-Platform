import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { RecurringTransactionModel } from "../models/RecurringTransaction";

const router = Router();
router.use(requireAuth);

const recurringSchema = z.object({
  description: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(2).max(60),
  dayOfMonth: z.coerce.number().int().min(1).max(31),
  status: z.enum(["completed", "pending"]).default("completed"),
  active: z.boolean().default(true),
  lastGeneratedMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

function serializeRecurring(item: Awaited<ReturnType<typeof RecurringTransactionModel.findOne>>) {
  if (!item) return null;
  return {
    id: item._id.toString(),
    description: item.description,
    amount: item.amount,
    type: item.type,
    category: item.category,
    dayOfMonth: item.dayOfMonth,
    status: item.status,
    active: item.active,
    lastGeneratedMonth: item.lastGeneratedMonth,
  };
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const recurringTransactions = await RecurringTransactionModel.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(200);
    res.json({ recurringTransactions: recurringTransactions.map(item => serializeRecurring(item)) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = recurringSchema.parse(req.body);
    const recurringTransaction = await RecurringTransactionModel.create({
      ...input,
      userId: new Types.ObjectId(req.userId as string),
    });

    res.status(201).json({ recurringTransaction: serializeRecurring(recurringTransaction) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "ID inválido." });
      return;
    }

    const input = recurringSchema.partial().parse(req.body);
    const recurringTransaction = await RecurringTransactionModel.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: input },
      { new: true, runValidators: true },
    );

    if (!recurringTransaction) {
      res.status(404).json({ message: "Recorrência não encontrada." });
      return;
    }

    res.json({ recurringTransaction: serializeRecurring(recurringTransaction) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "ID inválido." });
      return;
    }

    await RecurringTransactionModel.findOneAndDelete({ _id: id, userId: req.userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
