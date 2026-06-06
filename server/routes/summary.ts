import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { CategoryModel } from "../models/Category";
import { TransactionModel } from "../models/Transaction";
import { serializeCategory, serializeTransaction } from "../utils/serializers";

const router = Router();
router.use(requireAuth);

function monthLabel(monthIndex: number) {
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][monthIndex] ?? "";
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const userId = new Types.ObjectId(req.userId);
    const [transactions, categories] = await Promise.all([
      TransactionModel.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(500),
      CategoryModel.find({ userId }).sort({ name: 1 }),
    ]);

    const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const pending = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);

    const now = new Date();
    const monthly = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6 + index, 1));
      const month = date.getUTCMonth();
      const year = date.getUTCFullYear();
      const items = transactions.filter(t => t.date.getUTCMonth() === month && t.date.getUTCFullYear() === year);
      return {
        label: monthLabel(month),
        income: items.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
        expense: items.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
      };
    });

    const spentByCategory = new Map<string, number>();
    transactions.filter(t => t.type === "expense").forEach(transaction => {
      spentByCategory.set(transaction.category, (spentByCategory.get(transaction.category) ?? 0) + transaction.amount);
    });

    res.json({
      stats: { income, expense, balance: income - expense, pending, count: transactions.length },
      monthly,
      categories: categories.map(category => serializeCategory(category, spentByCategory.get(category.name) ?? 0)),
      recentTransactions: transactions.slice(0, 8).map(serializeTransaction),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
