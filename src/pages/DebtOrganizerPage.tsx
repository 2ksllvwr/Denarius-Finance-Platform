import { useMemo, useState } from "react";
import { IconArrowDown, IconArrowUp, IconTrash, IconWallet } from "@/components/Icons";
import type { DebtAllocation, Transaction } from "@/data/types";
import { formatCurrency, formatDate } from "@/data/types";
import { cn } from "@/utils/cn";

interface DebtOrganizerPageProps {
  transactions: Transaction[];
  allocations: DebtAllocation[];
  selectedMonth: string;
  selectedMonthLabel: string;
  currency: string;
  onAddAllocation: (input: Omit<DebtAllocation, "id" | "createdAt">) => Promise<void>;
  onDeleteAllocation: (id: string) => Promise<void>;
}

function byDate(a: Transaction, b: Transaction) {
  return new Date(`${a.date}T00:00:00`).getTime() - new Date(`${b.date}T00:00:00`).getTime();
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function DebtOrganizerPage({
  transactions,
  allocations,
  selectedMonth,
  selectedMonthLabel,
  currency,
  onAddAllocation,
  onDeleteAllocation,
}: DebtOrganizerPageProps) {
  const incomes = useMemo(() => transactions.filter(transaction => transaction.type === "income").sort(byDate), [transactions]);
  const expenses = useMemo(() => transactions.filter(transaction => transaction.type === "expense").sort(byDate), [transactions]);
  const monthAllocations = useMemo(() => allocations.filter(allocation => allocation.month === selectedMonth), [allocations, selectedMonth]);
  const transactionById = useMemo(() => new Map(transactions.map(transaction => [transaction.id, transaction])), [transactions]);
  const [incomeId, setIncomeId] = useState("");
  const [expenseId, setExpenseId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const usedByIncome = useMemo(() => monthAllocations.reduce<Record<string, number>>((totals, allocation) => {
    totals[allocation.incomeId] = (totals[allocation.incomeId] ?? 0) + allocation.amount;
    return totals;
  }, {}), [monthAllocations]);
  const paidByExpense = useMemo(() => monthAllocations.reduce<Record<string, number>>((totals, allocation) => {
    totals[allocation.expenseId] = (totals[allocation.expenseId] ?? 0) + allocation.amount;
    return totals;
  }, {}), [monthAllocations]);

  const totalIncome = incomes.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const allocatedTotal = monthAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  const openDebt = Math.max(0, totalExpense - allocatedTotal);
  const freeIncome = Math.max(0, totalIncome - allocatedTotal);
  const coverage = totalExpense > 0 ? Math.min(100, Math.round((allocatedTotal / totalExpense) * 100)) : 0;
  const selectedIncome = incomes.find(transaction => transaction.id === incomeId);
  const selectedExpense = expenses.find(transaction => transaction.id === expenseId);
  const incomeAvailable = selectedIncome ? Math.max(0, selectedIncome.amount - (usedByIncome[selectedIncome.id] ?? 0)) : 0;
  const expenseOpen = selectedExpense ? Math.max(0, selectedExpense.amount - (paidByExpense[selectedExpense.id] ?? 0)) : 0;

  const submit = async () => {
    setLocalError(null);
    const parsedAmount = parseAmount(amount);
    if (!incomeId || !expenseId) {
      setLocalError("Escolha um ganho e uma divida.");
      return;
    }
    if (parsedAmount <= 0) {
      setLocalError("Informe um valor maior que zero.");
      return;
    }
    if (parsedAmount > incomeAvailable) {
      setLocalError("Esse ganho nao tem saldo livre suficiente.");
      return;
    }
    if (parsedAmount > expenseOpen) {
      setLocalError("O valor passa do saldo aberto dessa divida.");
      return;
    }

    await onAddAllocation({ month: selectedMonth, incomeId, expenseId, amount: parsedAmount, notes });
    setAmount("");
    setNotes("");
  };

  return (
    <div className="mx-auto max-w-[1220px] space-y-5 p-4 animate-fade-in sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-gray-950 px-5 py-6 text-white sm:px-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">Organizador de dívidas</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Distribua ganhos manualmente</h2>
              <p className="mt-2 text-sm capitalize text-white/45">{selectedMonthLabel}</p>
            </div>
            <div className="min-w-[230px]">
              <div className="mb-2 flex items-center justify-between text-[11px] text-white/45">
                <span>Dividas organizadas</span>
                <span className="tabular-nums">{coverage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div className={cn("h-full rounded-full", openDebt > 0 ? "bg-warning-500" : "bg-success-500")} style={{ width: `${coverage}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 border-b border-border sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Ganhos", value: totalIncome, tone: "text-success-600", icon: IconArrowUp },
            { label: "Dividas", value: totalExpense, tone: "text-danger-500", icon: IconArrowDown },
            { label: "Distribuido", value: allocatedTotal, tone: "text-gray-900", icon: IconWallet },
            { label: openDebt > 0 ? "Em aberto" : "Sobra livre", value: openDebt > 0 ? openDebt : freeIncome, tone: openDebt > 0 ? "text-warning-500" : "text-success-600", icon: IconWallet },
          ].map((item, index) => (
            <div key={item.label} className={cn("flex items-center justify-between gap-4 px-5 py-4", index > 0 && "border-t border-border sm:border-l sm:border-t-0")}>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">{item.label}</p>
                <p className={cn("mt-2 text-lg font-semibold tabular-nums", item.tone)}>{formatCurrency(item.value, currency)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
                <item.icon size={17} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-gray-900">Nova distribuicao</h3>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-gray-400">Ganho usado</span>
              <select value={incomeId} onChange={event => setIncomeId(event.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-gray-700">
                <option value="">Escolha uma receita</option>
                {incomes.map(transaction => (
                  <option key={transaction.id} value={transaction.id}>
                    {transaction.description} - livre {formatCurrency(Math.max(0, transaction.amount - (usedByIncome[transaction.id] ?? 0)), currency)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-gray-400">Divida paga</span>
              <select value={expenseId} onChange={event => setExpenseId(event.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-gray-700">
                <option value="">Escolha um gasto</option>
                {expenses.map(transaction => (
                  <option key={transaction.id} value={transaction.id}>
                    {transaction.description} - aberto {formatCurrency(Math.max(0, transaction.amount - (paidByExpense[transaction.id] ?? 0)), currency)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-gray-400">Valor</span>
              <input value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" placeholder="0,00" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-gray-700" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-gray-400">Observacao</span>
              <input value={notes} onChange={event => setNotes(event.target.value)} placeholder="Opcional" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[13px] text-gray-700" />
            </label>

            {selectedIncome && selectedExpense && (
              <div className="rounded-xl border border-border bg-surface p-3 text-[11px] text-gray-500">
                <p>Disponivel no ganho: <strong className="text-gray-800">{formatCurrency(incomeAvailable, currency)}</strong></p>
                <p className="mt-1">Aberto na divida: <strong className="text-gray-800">{formatCurrency(expenseOpen, currency)}</strong></p>
              </div>
            )}
            {localError && <div className="rounded-xl border border-danger-100 bg-danger-50 p-3 text-xs text-danger-600">{localError}</div>}

            <button onClick={() => void submit()} className="w-full rounded-xl bg-gray-950 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800">
              Salvar distribuicao
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">Distribuicoes manuais</h3>
            <p className="mt-0.5 text-[11px] text-gray-400">{monthAllocations.length} vinculos neste mes</p>
          </div>
          <div className="divide-y divide-border">
            {monthAllocations.map(allocation => {
              const income = transactionById.get(allocation.incomeId);
              const expense = transactionById.get(allocation.expenseId);
              return (
                <div key={allocation.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900">
                        {income?.description ?? "Ganho removido"} paga {expense?.description ?? "divida removida"}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {income ? formatDate(income.date) : "--"} · {expense?.category ?? "Sem categoria"}
                      </p>
                      {allocation.notes && <p className="mt-2 text-[12px] text-gray-500">{allocation.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[13px] font-semibold tabular-nums text-gray-900">{formatCurrency(allocation.amount, currency)}</p>
                      <button onClick={() => void onDeleteAllocation(allocation.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:bg-danger-50 hover:text-danger-500" aria-label="Remover distribuicao">
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {monthAllocations.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-medium text-gray-700">Nenhuma distribuicao manual</p>
                <p className="mt-1 text-[12px] text-gray-400">Escolha uma receita, uma divida e o valor que sera usado.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
