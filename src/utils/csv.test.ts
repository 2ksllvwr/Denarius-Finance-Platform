import { describe, expect, it } from "vitest";
import { parseAmount, parseCsvTransactions } from "@/utils/csv";

describe("csv utils", () => {
  it("parses Brazilian decimal amounts", () => {
    expect(parseAmount("1.250,90")).toBe(1250.9);
    expect(parseAmount("99.50")).toBe(99.5);
  });

  it("parses semicolon CSV transactions", () => {
    const parsed = parseCsvTransactions([
      "data;descricao;tipo;categoria;status;valor",
      "05/06/2026;Salário;receita;Trabalho;concluida;8500,00",
      "2026-06-06;Mercado;despesa;Alimentação;pendente;230,50",
    ].join("\n"));

    expect(parsed).toEqual([
      { date: "2026-06-05", description: "Salário", type: "income", category: "Trabalho", status: "completed", amount: 8500 },
      { date: "2026-06-06", description: "Mercado", type: "expense", category: "Alimentação", status: "pending", amount: 230.5 },
    ]);
  });
});
