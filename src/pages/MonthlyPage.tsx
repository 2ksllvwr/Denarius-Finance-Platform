import { useEffect, useMemo, useState } from "react";
import {
  IconArrowDown,
  IconArrowUp,
  IconCalendar,
  IconCheck,
  IconClock,
  IconPlus,
  IconTrash,
  IconTrendDown,
  IconTrendUp,
  IconWallet,
} from "@/components/Icons";
import type { Category, MonthlyClosure, MonthlyGoal, RecurringTransaction, Stats, Transaction } from "@/data/types";
import { formatCurrency, formatDateFull } from "@/data/types";
import type { MonthlyGoalInput, RecurringTransactionInput } from "@/hooks/useFinanceApp";
import { cn } from "@/utils/cn";

interface MonthlyPageProps {
  stats: Stats;
  transactions: Transaction[];
  categories: Category[];
  recurringTransactions: RecurringTransaction[];
  selectedMonth: string;
  selectedMonthLabel: string;
  monthlyGoal: MonthlyGoal | null;
  monthlyClosure: MonthlyClosure | null;
  currency: string;
  onSaveGoal: (goal: MonthlyGoalInput) => Promise<void>;
  onCloseMonth: (notes?: string) => Promise<void>;
  onReopenMonth: () => Promise<void>;
  onAddRecurring: (transaction: RecurringTransactionInput) => Promise<void>;
  onToggleRecurring: (id: string) => Promise<void>;
  onDeleteRecurring: (id: string) => Promise<void>;
  onGenerateRecurring: () => Promise<void>;
}

const emptyRecurringForm = {
  description: "",
  amount: "",
  type: "expense" as "income" | "expense",
  category: "Moradia",
  dayOfMonth: "1",
  status: "completed" as "completed" | "pending",
  active: true,
};

function parseAmount(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function MonthlyPage({
  stats,
  transactions,
  categories,
  recurringTransactions,
  selectedMonth,
  selectedMonthLabel,
  monthlyGoal,
  monthlyClosure,
  currency,
  onSaveGoal,
  onCloseMonth,
  onReopenMonth,
  onAddRecurring,
  onToggleRecurring,
  onDeleteRecurring,
  onGenerateRecurring,
}: MonthlyPageProps) {
  const [goalForm, setGoalForm] = useState({ savingsTarget: "", spendingLimit: "", notes: "" });
  const [closureNotes, setClosureNotes] = useState("");
  const [recurringForm, setRecurringForm] = useState(emptyRecurringForm);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [generatingRecurring, setGeneratingRecurring] = useState(false);

  useEffect(() => {
    setGoalForm({
      savingsTarget: monthlyGoal?.savingsTarget ? String(monthlyGoal.savingsTarget).replace(".", ",") : "",
      spendingLimit: monthlyGoal?.spendingLimit ? String(monthlyGoal.spendingLimit).replace(".", ",") : "",
      notes: monthlyGoal?.notes ?? "",
    });
    setClosureNotes(monthlyClosure?.notes ?? "");
  }, [monthlyClosure, monthlyGoal, selectedMonth]);

  useEffect(() => {
    setRecurringForm(prev => ({ ...prev, category: categories[0]?.name ?? "Moradia" }));
  }, [categories]);

  const topExpenseCategory = useMemo(() => categories
    .filter(category => category.spent > 0)
    .sort((a, b) => b.spent - a.spent)[0] ?? null, [categories]);
  const lastTransaction = useMemo(() => [...transactions]
    .sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime())[0] ?? null, [transactions]);
  const readyRecurringCount = recurringTransactions.filter(item => item.active && item.lastGeneratedMonth !== selectedMonth).length;
  const savingTarget = monthlyGoal?.savingsTarget ?? 0;
  const spendingLimit = monthlyGoal?.spendingLimit ?? 0;
  const savingProgress = percent(stats.balance, savingTarget);
  const spendingProgress = percent(stats.expense, spendingLimit);
  const healthLabel = stats.balance >= savingTarget && savingTarget > 0
    ? "Meta batida"
    : stats.balance >= 0
      ? "Mês saudável"
      : "Ajuste necessário";
  const healthTone = stats.balance >= 0 ? "text-success-600 bg-success-50" : "text-danger-600 bg-danger-50";

  const saveGoal = async () => {
    setSavingGoal(true);
    await onSaveGoal({
      month: selectedMonth,
      savingsTarget: parseAmount(goalForm.savingsTarget) || 0,
      spendingLimit: parseAmount(goalForm.spendingLimit) || 0,
      notes: goalForm.notes,
    });
    setSavingGoal(false);
  };

  const closeMonth = async () => {
    await onCloseMonth(closureNotes);
  };

  const addRecurring = async () => {
    const amount = parseAmount(recurringForm.amount);
    if (!recurringForm.description.trim() || !Number.isFinite(amount) || amount <= 0) return;

    setSavingRecurring(true);
    await onAddRecurring({
      description: recurringForm.description,
      amount,
      type: recurringForm.type,
      category: recurringForm.category,
      dayOfMonth: Number(recurringForm.dayOfMonth) || 1,
      status: recurringForm.status,
      active: recurringForm.active,
    });
    setSavingRecurring(false);
    setRecurringForm({ ...emptyRecurringForm, category: categories[0]?.name ?? "Moradia" });
  };

  const generateRecurring = async () => {
    setGeneratingRecurring(true);
    await onGenerateRecurring();
    setGeneratingRecurring(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-5 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">
        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase">Organização mensal</p>
              <h2 className="text-2xl font-semibold text-gray-900 capitalize mt-1">{selectedMonthLabel}</h2>
              <p className="text-sm text-gray-400 mt-1">{transactions.length} movimentações registradas no período</p>
            </div>
            <span className={cn("w-fit px-3 py-1.5 rounded-full text-[12px] font-semibold", healthTone)}>{healthLabel}</span>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-5">
            {[
              { label: "Saldo", value: stats.balance, icon: IconWallet, color: stats.balance >= 0 ? "text-success-600" : "text-danger-600" },
              { label: "Receitas", value: stats.income, icon: IconTrendUp, color: "text-success-600" },
              { label: "Despesas", value: stats.expense, icon: IconTrendDown, color: "text-danger-600" },
              { label: "Pendentes", value: stats.pending, icon: IconClock, color: "text-warning-500" },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-gray-400 uppercase">{item.label}</span>
                  <item.icon size={15} className={item.color} />
                </div>
                <p className={cn("mt-3 text-lg font-bold tabular-nums", item.color)}>{formatCurrency(item.value, currency)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Meta de saldo</p>
                  <p className="text-[11px] text-gray-400">Quanto você quer sobrar no mês</p>
                </div>
                <span className="text-[12px] font-bold text-brand-600">{savingProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${savingProgress}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-gray-400">
                <span>{formatCurrency(Math.max(0, stats.balance), currency)}</span>
                <span>{formatCurrency(savingTarget, currency)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Limite de gastos</p>
                  <p className="text-[11px] text-gray-400">Controle o teto geral do mês</p>
                </div>
                <span className={cn("text-[12px] font-bold", spendingProgress >= 90 ? "text-danger-600" : spendingProgress >= 70 ? "text-warning-500" : "text-success-600")}>{spendingProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", spendingProgress >= 90 ? "bg-danger-500" : spendingProgress >= 70 ? "bg-warning-500" : "bg-success-500")} style={{ width: `${spendingProgress}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[11px] text-gray-400">
                <span>{formatCurrency(stats.expense, currency)}</span>
                <span>{formatCurrency(spendingLimit, currency)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase">Fechamento</p>
              <h3 className="text-lg font-semibold text-gray-900 mt-1">{monthlyClosure ? "Mês fechado" : "Mês aberto"}</h3>
            </div>
            <IconCalendar size={22} className={monthlyClosure ? "text-success-600" : "text-gray-300"} />
          </div>

          {monthlyClosure && (
            <div className="mt-4 rounded-2xl bg-success-50 border border-success-100 p-4">
              <p className="text-[12px] font-semibold text-success-600">Fechado em {formatDateTime(monthlyClosure.closedAt)}</p>
              <div className="grid grid-cols-2 gap-3 mt-3 text-[12px]">
                <span className="text-gray-500">Saldo salvo</span>
                <strong className="text-right text-success-600">{formatCurrency(monthlyClosure.balance, currency)}</strong>
                <span className="text-gray-500">Lançamentos</span>
                <strong className="text-right text-gray-800">{monthlyClosure.transactionCount}</strong>
              </div>
            </div>
          )}

          <label className="block mt-4">
            <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Notas do mês</span>
            <textarea value={closureNotes} onChange={event => setClosureNotes(event.target.value)} rows={4} placeholder="Ex: revisar gastos com mercado e manter reserva..." className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none" />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 mt-4">
            <button onClick={closeMonth} className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-2.5 text-[13px] font-semibold hover:bg-gray-800 transition-all">
              <IconCheck size={15} /> {monthlyClosure ? "Atualizar fechamento" : "Fechar mês"}
            </button>
            <button onClick={() => void onReopenMonth()} disabled={!monthlyClosure} className="border border-border rounded-xl py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Reabrir
            </button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
        <section className="bg-card border border-border rounded-2xl p-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Metas do mês</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Salvas localmente por conta e por mês</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Meta de saldo</span>
              <input inputMode="decimal" value={goalForm.savingsTarget} onChange={event => setGoalForm(prev => ({ ...prev, savingsTarget: event.target.value }))} placeholder="0,00" className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Limite de gastos</span>
              <input inputMode="decimal" value={goalForm.spendingLimit} onChange={event => setGoalForm(prev => ({ ...prev, spendingLimit: event.target.value }))} placeholder="0,00" className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
            </label>
          </div>
          <label className="block mt-3">
            <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Prioridade</span>
            <textarea value={goalForm.notes} onChange={event => setGoalForm(prev => ({ ...prev, notes: event.target.value }))} rows={3} placeholder="O foco financeiro deste mês..." className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none" />
          </label>
          <button onClick={() => void saveGoal()} disabled={savingGoal} className="mt-4 w-full bg-brand-500 text-white rounded-xl py-2.5 text-[13px] font-semibold hover:bg-brand-600 disabled:opacity-50 transition-all">
            {savingGoal ? "Salvando..." : "Salvar metas"}
          </button>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Leitura rápida</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Sinais úteis para organizar o mês</p>
            </div>
            <button onClick={() => void generateRecurring()} disabled={generatingRecurring || readyRecurringCount === 0} className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl px-4 py-2.5 text-[13px] font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <IconPlus size={15} /> {generatingRecurring ? "Gerando..." : `Gerar recorrentes (${readyRecurringCount})`}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="rounded-2xl bg-surface border border-border p-4">
              <p className="text-[11px] font-medium text-gray-400 uppercase">Maior categoria</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 truncate">{topExpenseCategory?.name ?? "Sem despesas"}</p>
              <p className="text-[12px] text-gray-400 mt-1">{formatCurrency(topExpenseCategory?.spent ?? 0, currency)}</p>
            </div>
            <div className="rounded-2xl bg-surface border border-border p-4">
              <p className="text-[11px] font-medium text-gray-400 uppercase">Último lançamento</p>
              <p className="mt-2 text-sm font-semibold text-gray-900 truncate">{lastTransaction?.description ?? "Nenhum"}</p>
              <p className="text-[12px] text-gray-400 mt-1">{lastTransaction ? formatDateFull(lastTransaction.date) : "Sem data"}</p>
            </div>
            <div className="rounded-2xl bg-surface border border-border p-4">
              <p className="text-[11px] font-medium text-gray-400 uppercase">Recorrências</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{recurringTransactions.filter(item => item.active).length} ativas</p>
              <p className="text-[12px] text-gray-400 mt-1">{readyRecurringCount} prontas para gerar</p>
            </div>
          </div>
        </section>
      </div>

      <section className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Transações recorrentes</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Cadastre contas fixas, salários e compromissos mensais</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="p-5 border-b xl:border-b-0 xl:border-r border-border bg-surface/40">
            <div className="flex bg-card border border-border p-1 rounded-xl">
              {(["expense", "income"] as const).map(type => (
                <button key={type} onClick={() => setRecurringForm(prev => ({ ...prev, type }))} className={cn(
                  "flex-1 py-2 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-2",
                  recurringForm.type === type ? type === "expense" ? "bg-danger-500 text-white" : "bg-success-500 text-white" : "text-gray-400 hover:text-gray-600",
                )}>
                  {type === "expense" ? <IconArrowDown size={14} /> : <IconArrowUp size={14} />}
                  {type === "expense" ? "Despesa" : "Receita"}
                </button>
              ))}
            </div>

            <div className="space-y-3 mt-4">
              <label className="block">
                <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Descrição</span>
                <input value={recurringForm.description} onChange={event => setRecurringForm(prev => ({ ...prev, description: event.target.value }))} placeholder="Ex: Aluguel, salário..." className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Valor</span>
                  <input inputMode="decimal" value={recurringForm.amount} onChange={event => setRecurringForm(prev => ({ ...prev, amount: event.target.value }))} placeholder="0,00" className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Dia</span>
                  <input type="number" min={1} max={31} value={recurringForm.dayOfMonth} onChange={event => setRecurringForm(prev => ({ ...prev, dayOfMonth: event.target.value }))} className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Categoria</span>
                  <select value={recurringForm.category} onChange={event => setRecurringForm(prev => ({ ...prev, category: event.target.value }))} className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all">
                    {categories.map(category => <option key={category.id} value={category.name}>{category.icon} {category.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Status</span>
                  <select value={recurringForm.status} onChange={event => setRecurringForm(prev => ({ ...prev, status: event.target.value as "completed" | "pending" }))} className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all">
                    <option value="completed">Concluída</option>
                    <option value="pending">Pendente</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-[13px] text-gray-600">
                <input type="checkbox" checked={recurringForm.active} onChange={event => setRecurringForm(prev => ({ ...prev, active: event.target.checked }))} className="w-4 h-4 accent-brand-500" />
                Recorrência ativa
              </label>
              <button onClick={() => void addRecurring()} disabled={savingRecurring} className="w-full bg-gray-900 text-white rounded-xl py-2.5 text-[13px] font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all">
                {savingRecurring ? "Salvando..." : "Adicionar recorrência"}
              </button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {recurringTransactions.map(item => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50/60 transition-colors">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", item.type === "income" ? "bg-success-50" : "bg-danger-50")}>
                  {item.type === "income" ? <IconArrowUp size={16} className="text-success-600" /> : <IconArrowDown size={16} className="text-danger-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{item.description}</p>
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-semibold", item.active ? "bg-success-50 text-success-600" : "bg-gray-100 text-gray-400")}>{item.active ? "Ativa" : "Pausada"}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Dia {item.dayOfMonth} · {item.category} · {item.lastGeneratedMonth === selectedMonth ? "gerada neste mês" : "não gerada neste mês"}
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className={cn("text-[13px] font-bold tabular-nums", item.type === "income" ? "text-success-600" : "text-gray-700")}>{formatCurrency(item.amount, currency)}</span>
                  <button onClick={() => void onToggleRecurring(item.id)} className="px-3 py-2 rounded-xl border border-border text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    {item.active ? "Pausar" : "Ativar"}
                  </button>
                  <button onClick={() => void onDeleteRecurring(item.id)} className="w-9 h-9 rounded-xl text-gray-300 hover:text-danger-500 hover:bg-danger-50 flex items-center justify-center transition-colors" aria-label="Remover recorrência">
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>
            ))}
            {recurringTransactions.length === 0 && (
              <div className="p-10 text-center text-sm text-gray-400">Nenhuma recorrência cadastrada.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
