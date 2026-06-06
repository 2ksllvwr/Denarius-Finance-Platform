import { Router } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { CategoryModel } from "../models/Category";
import { TransactionModel } from "../models/Transaction";
import { serializeCategory } from "../utils/serializers";

const router = Router();
router.use(requireAuth);

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().min(1).max(8).default("📌"),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  budget: z.coerce.number().min(0).default(0),
});

async function getSpentByCategory(userId: string) {
  const rows = await TransactionModel.aggregate<{ _id: string; spent: number }>([
    { $match: { userId: new Types.ObjectId(userId), type: "expense" } },
    { $group: { _id: "$category", spent: { $sum: "$amount" } } },
  ]);
  return new Map(rows.map(row => [row._id, row.spent]));
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const [categories, spentByCategory] = await Promise.all([
      CategoryModel.find({ userId: req.userId }).sort({ name: 1 }),
      getSpentByCategory(req.userId!),
    ]);

    res.json({ categories: categories.map(category => serializeCategory(category, spentByCategory.get(category.name) ?? 0)) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const input = categorySchema.parse(req.body);
    const category = await CategoryModel.create({ ...input, userId: req.userId });
    res.status(201).json({ category: serializeCategory(category, 0) });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const input = categorySchema.partial().parse(req.body);
    const category = await CategoryModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: input },
      { new: true },
    );

    if (!category) {
      res.status(404).json({ message: "Categoria não encontrada." });
      return;
    }

    const spentByCategory = await getSpentByCategory(req.userId!);
    res.json({ category: serializeCategory(category, spentByCategory.get(category.name) ?? 0) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const deleted = await CategoryModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) {
      res.status(404).json({ message: "Categoria não encontrada." });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
