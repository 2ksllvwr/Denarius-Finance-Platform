import { Types } from "mongoose";
import { CategoryModel } from "../models/Category.js";
import { SettingsModel } from "../models/Settings.js";
import { TransactionModel } from "../models/Transaction.js";

const defaultCategories = [
  { name: "Moradia", icon: "🏠", color: "#6366f1", budget: 3000 },
  { name: "Alimentação", icon: "🛒", color: "#f59e0b", budget: 1200 },
  { name: "Transporte", icon: "🚗", color: "#3b82f6", budget: 500 },
  { name: "Saúde", icon: "💊", color: "#10b981", budget: 400 },
  { name: "Entretenimento", icon: "🎬", color: "#ec4899", budget: 300 },
  { name: "Investimentos", icon: "📈", color: "#8b5cf6", budget: 2000 },
  { name: "Trabalho", icon: "💼", color: "#059669", budget: 0 },
  { name: "Freelance", icon: "🖥️", color: "#0ea5e9", budget: 0 },
];

const sampleTransactions = [
  { description: "Salário", amount: 8500, type: "income", category: "Trabalho", date: "2026-06-05", status: "completed" },
  { description: "Aluguel", amount: 2200, type: "expense", category: "Moradia", date: "2026-06-02", status: "completed" },
  { description: "Supermercado", amount: 645.3, type: "expense", category: "Alimentação", date: "2026-06-03", status: "completed" },
  { description: "Freelance Design", amount: 3200, type: "income", category: "Freelance", date: "2026-06-01", status: "completed" },
  { description: "Energia elétrica", amount: 189.5, type: "expense", category: "Moradia", date: "2026-06-04", status: "pending" },
] as const;

export async function createDefaultWorkspace(userId: string) {
  const objectUserId = new Types.ObjectId(userId);

  await CategoryModel.insertMany(defaultCategories.map(category => ({ ...category, userId: objectUserId })), {
    ordered: false,
  }).catch(() => undefined);

  await SettingsModel.findOneAndUpdate(
    { userId: objectUserId },
    { $setOnInsert: { userId: objectUserId, notifEmail: true, notifBudget: true, currency: "BRL" } },
    { upsert: true, new: true },
  );

  const existingTransactions = await TransactionModel.countDocuments({ userId: objectUserId });
  if (existingTransactions === 0) {
    await TransactionModel.insertMany(
      sampleTransactions.map(transaction => ({
        ...transaction,
        userId: objectUserId,
        date: new Date(`${transaction.date}T00:00:00.000Z`),
      })),
    );
  }
}
