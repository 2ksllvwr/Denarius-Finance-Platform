import type { Category, MonthlyPoint, Stats, Transaction } from "@/data/types";
import { formatCurrency, formatDate } from "@/data/types";
import { cn } from "@/utils/cn";
import {
  IconArrowDown,
  IconArrowUp,
  IconChevronRight,
  IconClock,
  IconTrendDown,
  IconTrendUp,
} from "@/components/Icons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardPageProps {
  stats: Stats;
  transactions: Transaction[];
  categories: Category[];
  monthly: MonthlyPoint[];
  currency: string;
  userName: string;
  selectedMonthLabel: string;
  onViewTransactions: () => void;
  onNewTransaction: () => void;
}

export function DashboardPage({
  stats,
  transactions,
  categories,
  monthly,
  currency,
  userName,
  selectedMonthLabel,
  onViewTransactions,
  onNewTransaction,
}: DashboardPageProps) {
  const categoryChart = categories
    .filter(category => category.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);
  const categoryTotal = categoryChart.reduce((total, category) => total + category.spent, 0);
  const monthlyIncome = monthly.reduce((total, point) => total + point.income, 0);
  const monthlyExpense = monthly.reduce((total, point) => total + point.expense, 0);
  const firstName = userName.trim().split(/\s+/)[0] || "tudo bem";
  const expenseRatio = stats.income > 0 ? Math.min(100, Math.round((stats.expense / stats.income) * 100)) : 0;
  const savingsRate = stats.income > 0 ? Math.round((stats.balance / stats.income) * 100) : 0;
  const completedCount = transactions.filter(transaction => transaction.status === "completed").length;
  const pendingCount = transactions.filter(transaction => transaction.status === "pending").length;
  const budgetCategories = categories.filter(category => category.budget > 0);
  const tightestBudget = budgetCategories
    .map(category => ({ ...category, percent: category.budget > 0 ? Math.round((category.spent / category.budget) * 100) : 0 }))
    .sort((a, b) => b.percent - a.percent)[0];
  const bestAction = pendingCount > 0
    ? {
      title: "Revise pendências",
      body: `${pendingCount} lançamento${pendingCount === 1 ? "" : "s"} ainda precisa${pendingCount === 1 ? "" : "m"} de confirmação.`,
      label: "Abrir extrato",
      action: onViewTransactions,
      tone: "warning" as const,
    }
    : tightestBudget && tightestBudget.percent >= 80
      ? {
        title: "Atenção ao orçamento",
        body: `${tightestBudget.name} já consumiu ${Math.min(tightestBudget.percent, 100)}% do limite mensal.`,
        label: "Ver extrato",
        action: onViewTransactions,
        tone: "danger" as const,
      }
      : {
        title: stats.balance >= 0 ? "Mês sob controle" : "Revisar gastos",
        body: stats.balance >= 0
          ? "Seu resultado está positivo. Continue acompanhando os próximos lançamentos."
          : "Seu mês está negativo. Vale revisar os maiores gastos antes do fechamento.",
        label: "Nova transação",
        action: onNewTransaction,
        tone: stats.balance >= 0 ? "success" as const : "danger" as const,
      };
  const formatTooltipCurrency = (value: unknown) => formatCurrency(Number(value ?? 0), currency);
  const formatAxisCurrency = (value: number) => new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  const tooltipStyle = {
    borderRadius: 8,
    border: "1px solid #e7e9ec",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
    fontSize: 12,
  };
  const kpis = [
    { label: "Receitas", value: stats.income, detail: `${completedCount} concluídas`, icon: IconTrendUp, marker: "bg-success-500", tone: "text-success-600", iconTone: "bg-success-50 text-success-600" },
    { label: "Despesas", value: stats.expense, detail: `${expenseRatio}% das receitas`, icon: IconTrendDown, marker: "bg-danger-500", tone: "text-danger-600", iconTone: "bg-danger-50 text-danger-500" },
    { label: "Pendentes", value: stats.pending, detail: `${pendingCount} para revisar`, icon: IconClock, marker: "bg-warning-500", tone: "text-warning-500", iconTone: "bg-warning-50 text-warning-500" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1260px] mx-auto space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex items-end justify-between gap-4 py-1">
        <div>
          <p className="text-[11px] font-medium text-gray-400">Visão geral</p>
          <h2 className="mt-1 text-2xl sm:text-[28px] font-semibold tracking-[-0.025em] text-gray-950">Olá, {firstName}</h2>
        </div>
        <button onClick={onViewTransactions} className="hidden sm:flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-gray-900">Ver extrato <IconChevronRight size={14} /></button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_rgba(15,23,42,0.04)]">
        <div className="relative overflow-hidden bg-gray-950 px-5 py-6 text-white sm:px-7 sm:py-7">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(49,95,206,0.28),transparent_55%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.45fr_0.85fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 capitalize">{selectedMonthLabel}</span>
                <span className={cn(
                  "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                  stats.balance >= 0 ? "border-success-500/25 bg-success-500/10 text-success-500" : "border-danger-500/25 bg-danger-500/10 text-danger-500",
                )}>
                  {stats.balance >= 0 ? "Positivo" : "Negativo"}
                </span>
              </div>
              <p className="mt-5 text-[11px] font-medium text-white/45">Resultado do mês</p>
              <p className="mt-2 text-3xl sm:text-[38px] font-semibold tracking-[-0.035em] tabular-nums">{formatCurrency(stats.balance, currency)}</p>
              <div className="mt-5 max-w-xl">
                <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-white/45">
                  <span>Despesas sobre receitas</span>
                  <span className="tabular-nums">{expenseRatio}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", expenseRatio > 90 ? "bg-danger-500" : expenseRatio > 70 ? "bg-warning-500" : "bg-success-500")}
                    style={{ width: `${expenseRatio}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">Próxima ação</p>
                  <h3 className="mt-2 text-base font-semibold text-white">{bestAction.title}</h3>
                </div>
                <span className={cn(
                  "mt-0.5 h-2.5 w-2.5 rounded-full",
                  bestAction.tone === "success" ? "bg-success-500" : bestAction.tone === "warning" ? "bg-warning-500" : "bg-danger-500",
                )} />
              </div>
              <p className="mt-2 text-[13px] leading-5 text-white/55">{bestAction.body}</p>
              <button onClick={bestAction.action} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-gray-950 transition-all hover:bg-white/90 active:scale-[0.98]">
                {bestAction.label}
                <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-border sm:grid-cols-3">
          {kpis.map((item, index) => (
            <div key={item.label} className={cn("flex items-center justify-between gap-4 px-5 py-4 sm:px-7 sm:py-5", index > 0 && "border-t border-border sm:border-l sm:border-t-0")}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", item.marker)} />
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">{item.label}</p>
                </div>
                <p className={cn("mt-2 text-[15px] font-semibold tabular-nums sm:text-base", item.tone)}>{formatCurrency(item.value, currency)}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">{item.detail}</p>
              </div>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", item.iconTone)}>
                <item.icon size={17} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-gray-400">Taxa de sobra</p>
          <p className={cn("mt-2 text-xl font-semibold tabular-nums", savingsRate >= 0 ? "text-success-600" : "text-danger-500")}>{savingsRate}%</p>
          <p className="mt-1 text-[12px] text-gray-400">Resultado em relação às receitas.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-gray-400">Orçamentos ativos</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900">{budgetCategories.length}</p>
          <p className="mt-1 text-[12px] text-gray-400">Categorias com limite definido.</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-gray-400">Movimentações</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900">{stats.count}</p>
          <p className="mt-1 text-[12px] text-gray-400">Lançamentos no período.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Movimentações do mês</h2>
              <p className="text-[11px] text-gray-400 mt-0.5 capitalize">{selectedMonthLabel}</p>
            </div>
            <button onClick={onViewTransactions} className="text-[12px] font-medium text-brand-500 hover:text-brand-700 transition-colors flex items-center gap-1">Ver todas <IconChevronRight size={14} /></button>
          </div>
          <div className="divide-y divide-border">
            {transactions.slice(0, 8).map(tx => (
              <div key={tx.id} className="flex items-start sm:items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", tx.type === "income" ? "bg-success-50" : "bg-danger-50")}>
                  {tx.type === "income" ? <IconArrowUp size={15} className="text-success-600" /> : <IconArrowDown size={15} className="text-danger-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{tx.description}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                    <span className="text-[11px] text-gray-400">{tx.category}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                    <span className="text-[11px] text-gray-400">{formatDate(tx.date)}</span>
                    {tx.status === "pending" && <><span className="w-0.5 h-0.5 rounded-full bg-gray-300" /><span className="text-[10px] font-medium text-warning-500 bg-warning-50 px-1.5 py-0.5 rounded">Pendente</span></>}
                  </div>
                </div>
                <span className={cn("text-[12px] sm:text-[13px] font-semibold tabular-nums flex-shrink-0", tx.type === "income" ? "text-success-600" : "text-gray-700")}>{tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount, currency)}</span>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-gray-700">Comece pelo primeiro lançamento</p>
                <p className="mt-1 text-[12px] text-gray-400">Registre uma receita, despesa ou compra parcelada para ativar o painel.</p>
                <button onClick={onNewTransaction} className="mt-4 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-colors">Nova transação</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-gray-900">Orçamento mensal</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Limite por categoria no mês</p>
          </div>
          <div className="p-4 space-y-4">
            {budgetCategories.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-gray-700">Sem orçamentos definidos</p>
                <p className="mt-1 text-[12px] text-gray-400">Defina limites nas categorias para acompanhar seu mês com precisão.</p>
              </div>
            )}
            {budgetCategories.slice(0, 6).map(cat => {
              const pct = cat.budget > 0 ? Math.min(Math.round((cat.spent / cat.budget) * 100), 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} /><span className="text-[13px] font-medium text-gray-700">{cat.name}</span></div>
                    <span className={cn("text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-md", pct > 90 ? "bg-danger-50 text-danger-500" : pct > 70 ? "bg-warning-50 text-warning-500" : "bg-gray-100 text-gray-500")}>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-[5px] overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : cat.color }} /></div>
                  <div className="flex justify-between mt-1.5"><span className="text-[11px] text-gray-400 tabular-nums">{formatCurrency(cat.spent, currency)}</span><span className="text-[11px] text-gray-400 tabular-nums">{formatCurrency(cat.budget, currency)}</span></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.85fr] gap-4 sm:gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Visão mensal</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Entradas e saídas dos últimos meses</p>
            </div>
            <div className="flex items-center gap-5 sm:justify-end">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400"><span className="h-1.5 w-1.5 rounded-full bg-gray-900" />Entradas</div>
                <p className="mt-1 text-[12px] font-semibold tabular-nums text-gray-800">{formatCurrency(monthlyIncome, currency)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400"><span className="h-1.5 w-1.5 rounded-full bg-gray-300" />Saídas</div>
                <p className="mt-1 text-[12px] font-semibold tabular-nums text-gray-800">{formatCurrency(monthlyExpense, currency)}</p>
              </div>
            </div>
          </div>
          <div className="h-[230px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={3}>
                <CartesianGrid stroke="#eef0f2" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={formatAxisCurrency} width={50} />
                <Tooltip
                  cursor={{ fill: "#f6f7f8" }}
                  formatter={formatTooltipCurrency}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#6b7280", marginBottom: 6 }}
                />
                <Bar dataKey="income" name="Entradas" fill="#1f2937" radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Bar dataKey="expense" name="Saídas" fill="#cbd0d7" radius={[3, 3, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Categorias do mês</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Distribuição das despesas</p>
          </div>
          <div className="relative h-[210px] mt-3">
            {categoryChart.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChart} dataKey="spent" nameKey="name" innerRadius={61} outerRadius={82} paddingAngle={2} stroke="none">
                      {categoryChart.map(category => <Cell key={category.id} fill={category.color} />)}
                    </Pie>
                    <Tooltip formatter={formatTooltipCurrency} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Total</span>
                  <strong className="mt-1 max-w-[110px] truncate text-[13px] font-semibold tabular-nums text-gray-900">{formatCurrency(categoryTotal, currency)}</strong>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Sem despesas no mês.</div>
            )}
          </div>
          <div className="space-y-2">
            {categoryChart.map(category => (
              <div key={category.id} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="flex items-center gap-2 text-gray-500 truncate"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</span>
                <span className="flex items-center gap-3">
                  <span className="w-8 text-right text-[11px] tabular-nums text-gray-400">{categoryTotal > 0 ? Math.round((category.spent / categoryTotal) * 100) : 0}%</span>
                  <strong className="min-w-[78px] text-right text-gray-800 tabular-nums">{formatCurrency(category.spent, currency)}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
