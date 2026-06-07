import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { IconArrowDown, IconArrowUp, IconCheck, IconCopy, IconDownload, IconEdit, IconSearch, IconTrash } from "@/components/Icons";
import type { Category, Stats, Transaction } from "@/data/types";
import { formatCurrency, formatDateFull } from "@/data/types";
import type { TransactionInput } from "@/hooks/useFinanceApp";
import { cn } from "@/utils/cn";
import { parseAmount, parseCsvTransactions } from "@/utils/csv";
import { calculateStats, downloadCsv, exportPdf } from "@/utils/finance";

interface TransactionsPageProps {
  transactions: Transaction[];
  stats: Stats;
  categories: Category[];
  currency: string;
  selectedMonthLabel: string;
  onImport: (transactions: TransactionInput[]) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  onDuplicate: (id: string) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type TypeFilter = "all" | "income" | "expense";
type StatusFilter = "all" | "completed" | "pending";

export function TransactionsPage({ transactions, stats, categories, currency, selectedMonthLabel, onImport, onEdit, onDuplicate, onToggleStatus, onDelete }: TransactionsPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const minValue = parseAmount(minAmount);
  const maxValue = parseAmount(maxAmount);
  const hasFilters = Boolean(typeFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all" || search.trim() || minAmount.trim() || maxAmount.trim());

  const filtered = useMemo(() => transactions
    .filter(transaction => typeFilter === "all" || transaction.type === typeFilter)
    .filter(transaction => statusFilter === "all" || transaction.status === statusFilter)
    .filter(transaction => categoryFilter === "all" || transaction.category === categoryFilter)
    .filter(transaction => !Number.isFinite(minValue) || transaction.amount >= minValue)
    .filter(transaction => !Number.isFinite(maxValue) || transaction.amount <= maxValue)
    .filter(transaction => transaction.description.toLowerCase().includes(search.toLowerCase()) || transaction.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime()), [categoryFilter, maxValue, minValue, search, statusFilter, transactions, typeFilter]);

  const filteredStats = useMemo(() => calculateStats(filtered), [filtered]);
  const grouped = useMemo(() => filtered.reduce<Array<{ date: string; items: Transaction[] }>>((groups, transaction) => {
    const group = groups.find(item => item.date === transaction.date);
    if (group) group.items.push(transaction);
    else groups.push({ date: transaction.date, items: [transaction] });
    return groups;
  }, []), [filtered]);
  const average = filtered.length > 0 ? (filteredStats.income + filteredStats.expense) / filtered.length : 0;

  const remove = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const resetFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearch("");
    setMinAmount("");
    setMaxAmount("");
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMessage("");
    try {
      const parsed = parseCsvTransactions(await file.text());
      await onImport(parsed);
      setImportMessage(`${parsed.length} transações importadas.`);
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : "Não foi possível importar o arquivo.");
    } finally {
      event.currentTarget.value = "";
      setImporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-4 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <p className="text-[11px] font-medium text-gray-400 uppercase">Organização mensal</p>
            <h2 className="text-xl font-semibold text-gray-900 capitalize mt-1">{selectedMonthLabel}</h2>
            <p className="text-xs text-gray-400 mt-1">{filtered.length} de {transactions.length} movimentações visíveis</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="rounded-xl bg-success-50 px-3 py-2">
              <p className="text-[10px] text-success-600 font-semibold uppercase">Receitas</p>
              <p className="text-[13px] text-success-600 font-bold tabular-nums">{formatCurrency(stats.income, currency)}</p>
            </div>
            <div className="rounded-xl bg-danger-50 px-3 py-2">
              <p className="text-[10px] text-danger-600 font-semibold uppercase">Despesas</p>
              <p className="text-[13px] text-danger-600 font-bold tabular-nums">{formatCurrency(stats.expense, currency)}</p>
            </div>
            <div className="rounded-xl bg-gray-100 px-3 py-2">
              <p className="text-[10px] text-gray-500 font-semibold uppercase">Saldo</p>
              <p className={cn("text-[13px] font-bold tabular-nums", stats.balance >= 0 ? "text-success-600" : "text-danger-600")}>{formatCurrency(stats.balance, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
          <div className="relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por descrição ou categoria..." className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
          </div>
          <div className="flex bg-surface border border-border p-1 rounded-xl">
            {[
              { id: "all", label: "Todas" },
              { id: "income", label: "Receitas" },
              { id: "expense", label: "Despesas" },
            ].map(item => (
              <button key={item.id} onClick={() => setTypeFilter(item.id as TypeFilter)} className={cn("px-3 sm:px-4 py-2 rounded-lg text-[12px] font-medium transition-all", typeFilter === item.id ? "bg-gray-900 text-white shadow-sm" : "text-gray-400 hover:text-gray-600")}>{item.label}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-3">
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as StatusFilter)} className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            <option value="all">Todos os status</option>
            <option value="completed">Concluídas</option>
            <option value="pending">Pendentes</option>
          </select>
          <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            <option value="all">Todas as categorias</option>
            {categories.map(category => <option key={category.id} value={category.name}>{category.name}</option>)}
          </select>
          <input inputMode="decimal" value={minAmount} onChange={event => setMinAmount(event.target.value)} placeholder="Valor mínimo" className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          <input inputMode="decimal" value={maxAmount} onChange={event => setMaxAmount(event.target.value)} placeholder="Valor máximo" className="bg-surface border border-border rounded-xl px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          <button onClick={resetFilters} disabled={!hasFilters} className="border border-border rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Limpar filtros</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-[11px] font-medium text-gray-400 uppercase">Saldo filtrado</p>
          <p className={cn("mt-2 text-lg font-bold tabular-nums", filteredStats.balance >= 0 ? "text-success-600" : "text-danger-600")}>{formatCurrency(filteredStats.balance, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-[11px] font-medium text-gray-400 uppercase">Média por item</p>
          <p className="mt-2 text-lg font-bold tabular-nums text-gray-900">{formatCurrency(average, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-[11px] font-medium text-gray-400 uppercase">Pendências no filtro</p>
          <p className="mt-2 text-lg font-bold tabular-nums text-warning-500">{formatCurrency(filteredStats.pending, currency)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => downloadCsv(filtered)} className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:border-border-hover transition-all bg-card"><IconDownload size={15} /> Exportar CSV</button>
        <button onClick={() => exportPdf(filtered, filteredStats)} className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:border-border-hover transition-all bg-card"><IconDownload size={15} /> Exportar PDF</button>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={event => void importCsv(event)} />
        <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all"><IconDownload size={15} /> {importing ? "Importando..." : "Importar CSV"}</button>
        {importMessage && <span className="self-center text-[12px] text-gray-400">{importMessage}</span>}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_120px_120px_120px_144px] gap-4 px-5 py-3 border-b border-border bg-surface text-[11px] font-medium text-gray-400 uppercase">
          <span>Descrição</span><span>Categoria</span><span>Data</span><span className="text-right">Valor</span><span />
        </div>
        <div className="divide-y divide-border">
          {grouped.map(group => (
            <div key={group.date}>
              <div className="px-4 sm:px-5 py-2 bg-surface text-[11px] font-semibold text-gray-400 capitalize">{formatDateFull(group.date)}</div>
              {group.items.map(transaction => (
                <div key={transaction.id} className={cn("grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_120px_120px_144px] gap-3 sm:gap-4 px-4 sm:px-5 py-4 items-center transition-all", deletingId === transaction.id ? "opacity-30 scale-[0.99]" : "hover:bg-gray-50/50")}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", transaction.type === "income" ? "bg-success-50" : "bg-danger-50")}>{transaction.type === "income" ? <IconArrowUp size={16} className="text-success-600" /> : <IconArrowDown size={16} className="text-danger-500" />}</div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 truncate">{transaction.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 sm:hidden"><span className="text-[11px] text-gray-400">{transaction.category}</span><span className="text-[11px] text-gray-400">{formatDateFull(transaction.date)}</span></div>
                      {transaction.status === "pending" && <span className="inline-flex mt-1 text-[10px] font-medium text-warning-500 bg-warning-50 px-1.5 py-0.5 rounded">Pendente</span>}
                    </div>
                  </div>
                  <span className="hidden sm:block text-[12px] text-gray-500 truncate">{transaction.category}</span>
                  <span className="hidden sm:block text-[12px] text-gray-400">{formatDateFull(transaction.date)}</span>
                  <span className={cn("text-[13px] font-semibold tabular-nums text-right", transaction.type === "income" ? "text-success-600" : "text-gray-700")}>{transaction.type === "income" ? "+" : "-"} {formatCurrency(transaction.amount, currency)}</span>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => void onToggleStatus(transaction.id)} className="flex w-8 h-8 items-center justify-center rounded-lg text-gray-300 hover:text-success-600 hover:bg-success-50 transition-all" aria-label="Alternar status"><IconCheck size={15} /></button>
                    <button onClick={() => onEdit(transaction)} className="flex w-8 h-8 items-center justify-center rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-all" aria-label="Editar transação"><IconEdit size={15} /></button>
                    <button onClick={() => void onDuplicate(transaction.id)} className="flex w-8 h-8 items-center justify-center rounded-lg text-gray-300 hover:text-gray-700 hover:bg-gray-100 transition-all" aria-label="Duplicar transação"><IconCopy size={15} /></button>
                    <button onClick={() => void remove(transaction.id)} className="flex w-8 h-8 items-center justify-center rounded-lg text-gray-300 hover:text-danger-500 hover:bg-danger-50 transition-all" aria-label="Remover transação"><IconTrash size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && <div className="p-10 text-center text-sm text-gray-400">Nenhuma transação encontrada neste mês.</div>}
        </div>
      </div>
    </div>
  );
}
