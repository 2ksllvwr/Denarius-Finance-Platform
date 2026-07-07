import type { Category, MonthlyPoint, Stats, Transaction } from "@/data/types";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return "Mês";

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function shiftMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1 + offset, 1);
  return getMonthKey(date);
}

export function getDateInMonth(monthKey: string, dayOfMonth: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const safeYear = year || new Date().getFullYear();
  const safeMonth = month || new Date().getMonth() + 1;
  const lastDay = new Date(safeYear, safeMonth, 0).getDate();
  const safeDay = Math.min(Math.max(Math.round(dayOfMonth), 1), lastDay);

  return `${safeYear}-${String(safeMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

export function filterTransactionsByMonth(transactions: Transaction[], monthKey: string) {
  return transactions.filter(transaction => transaction.date.startsWith(monthKey));
}

export function calculateStats(transactions: Transaction[]): Stats {
  const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const pending = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense, pending, count: transactions.length };
}

export function applyCategorySpent(categories: Category[], transactions: Transaction[]): Category[] {
  const spent = new Map<string, number>();
  transactions.filter(t => t.type === "expense").forEach(transaction => {
    spent.set(transaction.category, (spent.get(transaction.category) ?? 0) + transaction.amount);
  });

  return categories.map(category => ({ ...category, spent: spent.get(category.name) ?? 0 }));
}

export function calculateMonthlyData(transactions: Transaction[]): MonthlyPoint[] {
  const now = new Date();
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 6 + index, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const items = transactions.filter(transaction => {
      const transactionDate = new Date(`${transaction.date}T00:00:00`);
      return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
    });

    return {
      label: MONTHS[month] ?? "",
      income: items.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
      expense: items.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    };
  });
}

export function downloadCsv(transactions: Transaction[]) {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[";,\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };

  const rows = [
    ["data", "descricao", "tipo", "categoria", "status", "valor"],
    ...transactions.map(transaction => [
      transaction.date,
      transaction.description,
      transaction.type,
      transaction.category,
      transaction.status,
      transaction.amount.toFixed(2).replace(".", ","),
    ]),
  ];

  const csv = `\uFEFF${rows.map(row => row.map(escape).join(";")).join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Denarius-transacoes.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPdf(transactions: Transaction[], stats: Stats) {
  const rows = transactions.map(transaction => `
    <tr>
      <td>${transaction.date}</td>
      <td>${transaction.description}</td>
      <td>${transaction.type === "income" ? "Receita" : "Despesa"}</td>
      <td>${transaction.category}</td>
      <td>${transaction.status === "completed" ? "Concluída" : "Pendente"}</td>
      <td>R$ ${transaction.amount.toFixed(2).replace(".", ",")}</td>
    </tr>
  `).join("");

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Relatório Denarius</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { margin: 0 0 8px; }
          p { color: #555; }
          .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
          .card { border: 1px solid #ddd; border-radius: 12px; padding: 14px; }
          .label { color: #666; font-size: 12px; }
          .value { font-size: 18px; font-weight: 700; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border-bottom: 1px solid #eee; padding: 10px; text-align: left; }
          th { background: #f7f7f7; }
        </style>
      </head>
      <body>
        <h1>Relatório Denarius</h1>
        <p>Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
        <div class="cards">
          <div class="card"><div class="label">Saldo</div><div class="value">R$ ${stats.balance.toFixed(2).replace(".", ",")}</div></div>
          <div class="card"><div class="label">Receitas</div><div class="value">R$ ${stats.income.toFixed(2).replace(".", ",")}</div></div>
          <div class="card"><div class="label">Despesas</div><div class="value">R$ ${stats.expense.toFixed(2).replace(".", ",")}</div></div>
          <div class="card"><div class="label">Pendentes</div><div class="value">R$ ${stats.pending.toFixed(2).replace(".", ",")}</div></div>
        </div>
        <table>
          <thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Categoria</th><th>Status</th><th>Valor</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}
