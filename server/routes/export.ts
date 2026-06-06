import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { TransactionModel } from "../models/Transaction";

const router = Router();
router.use(requireAuth);

function escapeCsv(value: string | number) {
  const text = String(value);
  if (/[";,\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

router.get("/csv", async (req: AuthRequest, res, next) => {
  try {
    const transactions = await TransactionModel.find({ userId: req.userId }).sort({ date: -1 });
    const rows = [
      ["data", "descricao", "tipo", "categoria", "status", "valor"],
      ...transactions.map(transaction => [
        transaction.date.toISOString().slice(0, 10),
        transaction.description,
        transaction.type,
        transaction.category,
        transaction.status,
        transaction.amount.toFixed(2).replace(".", ","),
      ]),
    ];

    const csv = rows.map(row => row.map(escapeCsv).join(";")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=DENARIUS-transacoes.csv");
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
});

export default router;
