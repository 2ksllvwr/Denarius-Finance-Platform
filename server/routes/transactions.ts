import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { CategoryModel } from "../models/Category";
import { TransactionModel } from "../models/Transaction";
import { serializeTransaction } from "../utils/serializers";

const router = Router();
router.use(requireAuth);

const transactionSchema = z.object({
  description: z.string().trim().min(2).max(120),
  amount: z.coerce.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(2).max(60),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["completed", "pending"]).default("completed"),
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const { type, search } = req.query;
    const filter: Record<string, unknown> = { userId: req.userId };
    if (type === "income" || type === "expense") filter.type = type;
    if (typeof search === "string" && search.trim()) {
      filter.description = { $regex: search.trim(), $options: "i" };
    }

    const transactions = await TransactionModel.find(filter).sort({ date: -1, createdAt: -1 }).limit(500);
    res.json({ transactions: transactions.map(serializeTransaction) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = transactionSchema.parse(req.body);
    const userId = new Types.ObjectId(req.userId as string);

    if (input.type === "expense") {
      await CategoryModel.findOneAndUpdate(
        { userId, name: input.category },
        { $setOnInsert: { userId, name: input.category, icon: "📌", color: "#6366f1", budget: 0 } },
        { upsert: true },
      );
    }

    const transaction = await TransactionModel.create({
      ...input,
      userId,
      date: new Date(`${input.date}T00:00:00.000Z`),
    });

    res.status(201).json({ transaction: serializeTransaction(transaction) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const transactionId = String(req.params.id);
    if (!Types.ObjectId.isValid(transactionId)) {
      res.status(400).json({ message: "ID inválido." });
      return;
    }

    const deleted = await TransactionModel.findOneAndDelete({ _id: transactionId, userId: req.userId });
    if (!deleted) {
      res.status(404).json({ message: "Transação não encontrada." });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.delete("/", async (req: AuthRequest, res, next) => {
  try {
    await TransactionModel.deleteMany({ userId: req.userId });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
