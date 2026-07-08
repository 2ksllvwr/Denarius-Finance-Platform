import { useMemo } from "react";
import {
  IconArrowDown,
  IconBarChart,
  IconCalendar,
  IconCheck,
  IconClock,
  IconWallet,
} from "@/components/Icons";
import type { Account, Category, Stats, Transaction } from "@/data/types";
import { formatCurrency, formatDateFull } from "@/data/types";
import { cn } from "@/utils/cn";

interface InsightsPageProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  stats: Stats;
  currency: string;
  selectedMonthLabel: string;
  onReviewTransactions: () => void;
  onOpenAccounts: () => void;
  onOpenBudgets: () => void;
}

function accountBalance(account: Account, transactions: Transaction[]) {
  return account.balance + transactions
    .filter(transaction => transaction.accountId === account.id && transaction.status === "completed")
    .reduce((sum, transaction) => sum + (transaction.type === "income" ? transaction.amount : -transaction.amount), 0);
}

export function InsightsPage({
  transactions,
  accounts,
  categories,
  stats,
  currency,
  selectedMonthLabel,
  onReviewTransactions,
  onOpenAccounts,
  onOpenBudgets,
}: InsightsPageProps) {
  const insights = useMemo(() => {
    const expenses = transactions.filter(transaction => transaction.type === "expense");
    const income = transactions.filter(transaction => transaction.type === "income");
    const pending = transactions.filter(transaction => transaction.status === "pending");
    const withoutAccount = transactions.filter(transaction => !transaction.accountId);
    const withoutBudget = categories.filter(category => category.budget <= 0 && category.spent > 0);
    const largestExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const accountSummaries = accounts.map(account => ({
      account,
      projected: accountBalance(account, transactions),
      linkedCount: transactions.filter(transaction => transaction.accountId === account.id).length,
    }));
    const topCategories = categories
      .filter(category => category.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
    const timeline = [...transactions]
      .sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime())
      .slice(0, 8);

    return {
      expenses,
      income,
      pending,
      withoutAccount,
      withoutBudget,
      largestExpenses,
      accountSummaries,
      topCategories,
      timeline,
    };
  }, [accounts, categories, transactions]);

  const projectedBalance = stats.balance - stats.pending;
  const reviewCount = insights.pending.length + insights.withoutAccount.length + insights.withoutBudget.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-5 animate-fade-in">
      <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Relatórios</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-950 capitalize">{selectedMonthLabel}</h2>
          <p className="mt-2 text-sm text-gray-500 leading-6">Revisão objetiva de lançamentos, contas, cartões, orçamentos e movimentos que precisam de atenção.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: "Saldo observado", value: formatCurrency(stats.balance, currency), icon: IconWallet, tone: stats.balance >= 0 ? "text-success-600 bg-success-50" : "text-danger-600 bg-danger-50" },
          { label: "Saldo projetado", value: formatCurrency(projectedBalance, currency), icon: IconBarChart, tone: projectedBalance >= 0 ? "text-success-600 bg-success-50" : "text-danger-600 bg-danger-50" },
          { label: "Pendentes", value: String(insights.pending.length), icon: IconClock, tone: "text-warning-500 bg-warning-50" },
          { label: "Para revisar", value: String(reviewCount), icon: IconCheck, tone: reviewCount > 0 ? "text-danger-500 bg-danger-50" : "text-success-600 bg-success-50" },
        ].map(item => (
          <div key={item.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium text-gray-400 uppercase">{item.label}</p>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", item.tone)}>
                <item.icon size={16} />
              </div>
            </div>
            <p className="mt-3 text-xl font-semibold tabular-nums text-gray-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-gray-900">Fila de revisão</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Itens que deixam o rastreio menos preciso</p>
          </div>
          <div className="divide-y divide-border">
            <button onClick={onReviewTransactions} className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
              <p className="text-[13px] font-semibold text-gray-900">{insights.pending.length} lançamentos pendentes</p>
              <p className="mt-1 text-[11px] text-gray-400">Confirme o que já aconteceu ou mantenha como previsto.</p>
            </button>
            <button onClick={onOpenAccounts} className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
              <p className="text-[13px] font-semibold text-gray-900">{insights.withoutAccount.length} lançamentos sem conta</p>
              <p className="mt-1 text-[11px] text-gray-400">Vincule conta ou cartão para melhorar saldos projetados.</p>
            </button>
            <button onClick={onOpenBudgets} className="w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors">
              <p className="text-[13px] font-semibold text-gray-900">{insights.withoutBudget.length} categorias gastando sem orçamento</p>
              <p className="mt-1 text-[11px] text-gray-400">Defina limites para acompanhar desvios do mês.</p>
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-gray-900">Maiores despesas</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Pontos de maior impacto no mês</p>
          </div>
          <div className="divide-y divide-border">
            {insights.largestExpenses.map(transaction => (
              <div key={transaction.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{transaction.description}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{transaction.category} · {formatDateFull(transaction.date)}</p>
                </div>
                <p className="text-[13px] font-semibold text-danger-500 tabular-nums">{formatCurrency(transaction.amount, currency)}</p>
              </div>
            ))}
            {insights.largestExpenses.length === 0 && <p className="p-8 text-center text-sm text-gray-400">Sem despesas neste mês.</p>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900">Contas e cartões</h3>
          <div className="mt-4 space-y-3">
            {insights.accountSummaries.map(({ account, projected, linkedCount }) => (
              <div key={account.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{account.name}</p>
                  <p className="text-[11px] text-gray-400">{linkedCount} lançamentos vinculados</p>
                </div>
                <p className={cn("text-[13px] font-semibold tabular-nums", projected >= 0 ? "text-success-600" : "text-danger-500")}>{formatCurrency(projected, currency)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900">Categorias de maior gasto</h3>
          <div className="mt-4 space-y-3">
            {insights.topCategories.map(category => (
              <div key={category.id}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-[13px] font-semibold text-gray-800">{category.name}</span>
                  <span className="text-[12px] font-semibold text-gray-900 tabular-nums">{formatCurrency(category.spent, currency)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${category.budget > 0 ? Math.min(100, (category.spent / category.budget) * 100) : 100}%`, backgroundColor: category.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <IconCalendar size={16} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Linha do tempo recente</h3>
        </div>
        <div className="divide-y divide-border">
          {insights.timeline.map(transaction => (
            <div key={transaction.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", transaction.type === "income" ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-500")}>
                  <IconArrowDown size={15} className={transaction.type === "income" ? "rotate-180" : ""} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{transaction.description}</p>
                  <p className="text-[11px] text-gray-400">{formatDateFull(transaction.date)} · {transaction.status === "pending" ? "Pendente" : "Concluído"}</p>
                </div>
              </div>
              <p className={cn("text-[13px] font-semibold tabular-nums", transaction.type === "income" ? "text-success-600" : "text-gray-800")}>{transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount, currency)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
