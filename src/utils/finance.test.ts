import { describe, expect, it } from "vitest";
import type { Category, Transaction } from "@/data/types";
import { applyCategorySpent, calculateStats, filterTransactionsByMonth, getDateInMonth, shiftMonth } from "@/utils/finance";

const transactions: Transaction[] = [
  { id: "1", description: "Salário", amount: 5000, type: "income", category: "Trabalho", date: "2026-06-05", status: "completed" },
  { id: "2", description: "Mercado", amount: 400, type: "expense", category: "Alimentação", date: "2026-06-06", status: "completed" },
  { id: "3", description: "Conta", amount: 120, type: "expense", category: "Moradia", date: "2026-07-01", status: "pending" },
];

describe("finance utils", () => {
  it("calculates stats from selected transactions", () => {
    expect(calculateStats(transactions)).toEqual({
      income: 5000,
      expense: 520,
      balance: 4480,
      pending: 120,
      count: 3,
    });
  });

  it("filters transactions by month key", () => {
    expect(filterTransactionsByMonth(transactions, "2026-06")).toHaveLength(2);
  });

  it("applies category spending", () => {
    const categories: Category[] = [
      { id: "1", name: "Alimentação", icon: "", color: "#000", budget: 1000, spent: 0 },
      { id: "2", name: "Moradia", icon: "", color: "#000", budget: 1000, spent: 0 },
    ];

    expect(applyCategorySpent(categories, transactions).map(category => category.spent)).toEqual([400, 120]);
  });

  it("keeps recurring dates inside month bounds", () => {
    expect(getDateInMonth("2026-02", 31)).toBe("2026-02-28");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});
