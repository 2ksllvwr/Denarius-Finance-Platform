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
  IconWallet,
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
  selectedMonthLabel: string;
  onViewTransactions: () => void;
}

export function DashboardPage({ stats, transactions, categories, monthly, currency, selectedMonthLabel, onViewTransactions }: DashboardPageProps) {
  const categoryChart = categories
    .filter(category => category.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);
  const formatTooltipCurrency = (value: unknown) => formatCurrency(Number(value ?? 0), currency);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-5 sm:space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Saldo do mês", value: stats.balance, icon: IconWallet, color: stats.balance >= 0 ? "text-success-600" : "text-danger-600", bg: stats.balance >= 0 ? "bg-success-50" : "bg-danger-50" },
          { label: "Receitas", value: stats.income, icon: IconTrendUp, color: "text-success-600", bg: "bg-success-50" },
          { label: "Despesas", value: stats.expense, icon: IconTrendDown, color: "text-danger-600", bg: "bg-danger-50" },
          { label: "Pendente", value: stats.pending, icon: IconClock, color: "text-warning-500", bg: "bg-warning-50" },
        ].map((card, index) => (
          <div key={card.label} className="bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-border-hover transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center transition-colors", card.bg)}><card.icon size={15} className={card.color} /></div>
            </div>
            <p className={cn("text-xl sm:text-2xl font-bold tabular-nums tracking-tight", card.color)}>{formatCurrency(card.value, currency)}</p>
            {index === 0 && (
              <div className="mt-3 pt-3 border-t border-border hidden sm:block">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <IconTrendUp size={13} className="text-success-500" />
                  <span className="text-success-600 font-medium capitalize">{selectedMonthLabel}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", tx.type === "income" ? "bg-success-50" : "bg-danger-50")}>
                  {tx.type === "income" ? <IconArrowUp size={15} className="text-success-600" /> : <IconArrowDown size={15} className="text-danger-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{tx.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-400">{tx.category}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                    <span className="text-[11px] text-gray-400">{formatDate(tx.date)}</span>
                    {tx.status === "pending" && <><span className="w-0.5 h-0.5 rounded-full bg-gray-300" /><span className="text-[10px] font-medium text-warning-500 bg-warning-50 px-1.5 py-0.5 rounded">Pendente</span></>}
                  </div>
                </div>
                <span className={cn("text-[13px] font-semibold tabular-nums flex-shrink-0", tx.type === "income" ? "text-success-600" : "text-gray-700")}>{tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount, currency)}</span>
              </div>
            ))}
            {transactions.length === 0 && <p className="p-8 text-center text-sm text-gray-400">Nenhuma transação registrada.</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-gray-900">Orçamento mensal</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Limite por categoria no mês</p>
          </div>
          <div className="p-4 space-y-4">
            {categories.filter(category => category.budget > 0).slice(0, 6).map(cat => {
              const pct = cat.budget > 0 ? Math.min(Math.round((cat.spent / cat.budget) * 100), 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5"><span className="text-base">{cat.icon}</span><span className="text-[13px] font-medium text-gray-700">{cat.name}</span></div>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Visão mensal</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Comparativo receitas vs despesas</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-brand-500" /><span className="text-[11px] text-gray-500">Receitas</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm bg-danger-500" /><span className="text-[11px] text-gray-500">Despesas</span></div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  formatter={formatTooltipCurrency}
                  contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f0", boxShadow: "0 12px 30px rgba(15,23,42,0.08)" }}
                />
                <Bar dataKey="income" name="Receitas" fill="#3b6cf5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Categorias do mês</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Distribuição das despesas</p>
          </div>
          <div className="h-[220px] mt-4">
            {categoryChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChart} dataKey="spent" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3}>
                    {categoryChart.map(category => <Cell key={category.id} fill={category.color} />)}
                  </Pie>
                  <Tooltip formatter={formatTooltipCurrency} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">Sem despesas no mês.</div>
            )}
          </div>
          <div className="space-y-2">
            {categoryChart.map(category => (
              <div key={category.id} className="flex items-center justify-between gap-3 text-[12px]">
                <span className="flex items-center gap-2 text-gray-500 truncate"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</span>
                <strong className="text-gray-800 tabular-nums">{formatCurrency(category.spent, currency)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
