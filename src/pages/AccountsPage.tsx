import { useMemo, useState } from "react";
import { IconEdit, IconPlus, IconTrash, IconWallet } from "@/components/Icons";
import type { Account, Transaction } from "@/data/types";
import { formatCurrency } from "@/data/types";
import type { AccountInput } from "@/hooks/useFinanceApp";
import { cn } from "@/utils/cn";

interface AccountsPageProps {
  accounts: Account[];
  transactions: Transaction[];
  currency: string;
  onAdd: (account: AccountInput) => Promise<void>;
  onUpdate: (id: string, account: AccountInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ACCOUNT_TYPES: Array<{ id: Account["type"]; label: string }> = [
  { id: "checking", label: "Conta corrente" },
  { id: "savings", label: "Reserva" },
  { id: "cash", label: "Dinheiro" },
  { id: "credit", label: "Cartão" },
];

const emptyForm = {
  name: "",
  type: "checking" as Account["type"],
  balance: "",
  color: "#3b6cf5",
  closingDay: "1",
  dueDay: "10",
  creditLimit: "",
};

function parseMoney(value: string) {
  const amount = Number(value.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(amount) ? amount : 0;
}

function parseDay(value: string) {
  const day = Math.round(Number(value));
  return Number.isFinite(day) ? Math.min(Math.max(day, 1), 31) : undefined;
}

function formFromAccount(account: Account) {
  return {
    name: account.name,
    type: account.type,
    balance: String(account.balance).replace(".", ","),
    color: account.color,
    closingDay: String(account.closingDay ?? 1),
    dueDay: String(account.dueDay ?? 10),
    creditLimit: account.creditLimit ? String(account.creditLimit).replace(".", ",") : "",
  };
}

function transactionImpact(transaction: Transaction) {
  if (transaction.status !== "completed") return 0;
  return transaction.type === "income" ? transaction.amount : -transaction.amount;
}

export function AccountsPage({ accounts, transactions, currency, onAdd, onUpdate, onDelete }: AccountsPageProps) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const balanceFor = (account: Account) => account.balance + transactions
      .filter(transaction => transaction.accountId === account.id)
      .reduce((sum, transaction) => sum + transactionImpact(transaction), 0);
    const available = accounts
      .filter(account => account.type !== "credit")
      .reduce((sum, account) => sum + balanceFor(account), 0);
    const creditLimit = accounts
      .filter(account => account.type === "credit")
      .reduce((sum, account) => sum + (account.creditLimit ?? 0), 0);
    const creditUsed = accounts
      .filter(account => account.type === "credit")
      .reduce((sum, account) => sum + Math.abs(Math.min(balanceFor(account), 0)), 0);

    return { available, creditLimit, creditUsed };
  }, [accounts, transactions]);

  const submit = async () => {
    if (!form.name.trim()) return;

    const input: AccountInput = {
      name: form.name.trim(),
      type: form.type,
      balance: parseMoney(form.balance),
      color: form.color,
      closingDay: form.type === "credit" ? parseDay(form.closingDay) : undefined,
      dueDay: form.type === "credit" ? parseDay(form.dueDay) : undefined,
      creditLimit: form.type === "credit" ? parseMoney(form.creditLimit) : undefined,
    };

    setSaving(true);
    if (editingId) await onUpdate(editingId, input);
    else await onAdd(input);
    setSaving(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const edit = (account: Account) => {
    setEditingId(account.id);
    setForm(formFromAccount(account));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-5 animate-fade-in">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase">Disponível</p>
          <p className={cn("mt-2 text-2xl font-bold tabular-nums", totals.available >= 0 ? "text-success-600" : "text-danger-600")}>{formatCurrency(totals.available, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase">Limite de cartão</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{formatCurrency(totals.creditLimit, currency)}</p>
          <p className="mt-1 text-[11px] text-gray-400">Uso vinculado: {formatCurrency(totals.creditUsed, currency)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[11px] font-medium text-gray-400 uppercase">Contas cadastradas</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">{accounts.length}</p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{editingId ? "Editar conta" : "Nova conta"}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Mapeie bancos, dinheiro e cartões para evoluir o controle financeiro.</p>
          </div>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm(emptyForm); }} className="text-[12px] font-semibold text-gray-500 hover:text-gray-900">Cancelar</button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_170px_140px_110px] gap-3">
          <input value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Nome da conta" className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          <select value={form.type} onChange={event => setForm(prev => ({ ...prev, type: event.target.value as Account["type"] }))} className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
            {ACCOUNT_TYPES.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
          </select>
          <input value={form.balance} onChange={event => setForm(prev => ({ ...prev, balance: event.target.value }))} inputMode="decimal" placeholder={form.type === "credit" ? "Uso atual" : "Saldo"} className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          <input type="color" value={form.color} onChange={event => setForm(prev => ({ ...prev, color: event.target.value }))} className="h-[42px] bg-surface border border-border rounded-xl px-2" />
        </div>

        {form.type === "credit" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <input value={form.creditLimit} onChange={event => setForm(prev => ({ ...prev, creditLimit: event.target.value }))} inputMode="decimal" placeholder="Limite do cartão" className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            <input type="number" min={1} max={31} value={form.closingDay} onChange={event => setForm(prev => ({ ...prev, closingDay: event.target.value }))} placeholder="Fechamento" className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            <input type="number" min={1} max={31} value={form.dueDay} onChange={event => setForm(prev => ({ ...prev, dueDay: event.target.value }))} placeholder="Vencimento" className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          </div>
        )}

        <button onClick={() => void submit()} disabled={saving || !form.name.trim()} className="mt-4 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
          <IconPlus size={15} /> {saving ? "Salvando..." : editingId ? "Salvar conta" : "Criar conta"}
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(account => {
          const linkedTransactions = transactions.filter(transaction => transaction.accountId === account.id);
          const projectedBalance = account.balance + linkedTransactions.reduce((sum, transaction) => sum + transactionImpact(transaction), 0);

          return (
          <div key={account.id} className="bg-card border border-border rounded-2xl p-5 hover:border-border-hover transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${account.color}18`, color: account.color }}>
                  <IconWallet size={19} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{account.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{ACCOUNT_TYPES.find(type => type.id === account.type)?.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => edit(account)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-all" aria-label="Editar conta"><IconEdit size={15} /></button>
                <button onClick={() => void onDelete(account.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-danger-500 hover:bg-danger-50 transition-all" aria-label="Remover conta"><IconTrash size={15} /></button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface border border-border p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">{account.type === "credit" ? "Uso atual" : "Saldo"}</p>
                <p className="mt-1 text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(projectedBalance, currency)}</p>
              </div>
              <div className="rounded-xl bg-surface border border-border p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">{account.type === "credit" ? "Limite" : "Lancamentos"}</p>
                <p className="mt-1 text-sm font-bold text-gray-900 tabular-nums">{account.type === "credit" ? formatCurrency(account.creditLimit ?? 0, currency) : linkedTransactions.length}</p>
              </div>
            </div>
            {account.type === "credit" && (
              <p className="mt-3 text-[11px] text-gray-400">Fecha dia {account.closingDay ?? "-"} · vence dia {account.dueDay ?? "-"}</p>
            )}
          </div>
          );
        })}
      </section>
    </div>
  );
}
