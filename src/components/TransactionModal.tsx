import { useEffect, useState } from "react";
import type { Account, Category, Transaction, TransactionStatus } from "@/data/types";
import type { InstallmentTransactionInput } from "@/hooks/useFinanceApp";
import { cn } from "@/utils/cn";
import { IconArrowDown, IconArrowUp, IconX } from "@/components/Icons";

interface TransactionModalProps {
  categories: Category[];
  accounts: Account[];
  open: boolean;
  transaction?: Transaction | null;
  onClose: () => void;
  onSubmit: (transaction: InstallmentTransactionInput) => Promise<void>;
}

function parseAmount(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

export function TransactionModal({ accounts, categories, open, transaction, onClose, onSubmit }: TransactionModalProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense" as "income" | "expense",
    category: "Moradia",
    subcategory: "",
    tags: "",
    accountId: "",
    status: "completed" as TransactionStatus,
    date: new Date().toISOString().split("T")[0],
    installments: "1",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      description: transaction?.description ?? "",
      amount: transaction ? String(transaction.amount).replace(".", ",") : "",
      type: transaction?.type ?? "expense",
      category: transaction?.category ?? categories[0]?.name ?? "Moradia",
      subcategory: transaction?.subcategory ?? "",
      tags: transaction?.tags?.join(", ") ?? "",
      accountId: transaction?.accountId ?? accounts.find(account => account.type !== "credit")?.id ?? accounts[0]?.id ?? "",
      status: transaction?.status ?? "completed",
      date: transaction?.date ?? new Date().toISOString().split("T")[0],
      installments: "1",
    });
  }, [accounts, categories, open, transaction]);

  if (!open) return null;

  const amount = parseAmount(form.amount);
  const installments = Math.max(1, Math.min(Number(form.installments) || 1, 60));
  const canSubmit = form.description.trim().length >= 2 && Number.isFinite(amount) && amount > 0 && installments >= 1 && installments <= 60;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await onSubmit({
      description: form.description.trim(),
      amount,
      type: form.type,
      category: form.category,
      subcategory: form.subcategory.trim() || undefined,
      tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      accountId: form.accountId || undefined,
      status: form.status,
      date: form.date,
      installments,
    });
    setSaving(false);
    setForm({ description: "", amount: "", type: "expense", category: categories[0]?.name ?? "Moradia", subcategory: "", tags: "", accountId: accounts.find(account => account.type !== "credit")?.id ?? accounts[0]?.id ?? "", status: "completed", date: new Date().toISOString().split("T")[0], installments: "1" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-[440px] sm:border sm:border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col animate-slide-up" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">{transaction ? "Editar transação" : "Nova transação"}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">{transaction ? "Atualize os dados do lançamento" : "Registre uma movimentação"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-all"><IconX size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex bg-surface border border-border p-1 rounded-xl">
            {(["expense", "income"] as const).map(type => (
              <button key={type} onClick={() => setForm(prev => ({ ...prev, type }))} className={cn(
                "flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all flex items-center justify-center gap-2",
                form.type === type ? type === "expense" ? "bg-danger-500 text-white shadow-sm" : "bg-success-500 text-white shadow-sm" : "text-gray-400 hover:text-gray-600",
              )}>
                {type === "expense" ? <><IconArrowDown size={14} /> Despesa</> : <><IconArrowUp size={14} /> Receita</>}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Descrição</span>
            <input value={form.description} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} placeholder="Ex: Supermercado, Salário..." className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-gray-300" autoFocus />
          </label>

          <label className="block">
            <span className="text-[11px] font-medium text-gray-400 block mb-1.5">{!transaction && installments > 1 ? "Valor total (R$)" : "Valor (R$)"}</span>
            <input inputMode="decimal" value={form.amount} onChange={event => setForm(prev => ({ ...prev, amount: event.target.value }))} placeholder="0,00" className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-gray-300" />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Categoria</span>
              <select value={form.category} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))} className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none">
                {categories.map(category => <option key={category.id} value={category.name}>{category.icon} {category.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Conta</span>
              <select value={form.accountId} onChange={event => setForm(prev => ({ ...prev, accountId: event.target.value }))} className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none">
                <option value="">Sem conta</option>
                {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Subcategoria</span>
              <input value={form.subcategory} onChange={event => setForm(prev => ({ ...prev, subcategory: event.target.value }))} placeholder="Ex: Mercado, app, boleto" className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-gray-300" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Tags</span>
              <input value={form.tags} onChange={event => setForm(prev => ({ ...prev, tags: event.target.value }))} placeholder="Ex: casa, recorrente" className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-gray-300" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Data</span>
              <input type="date" value={form.date} onChange={event => setForm(prev => ({ ...prev, date: event.target.value }))} className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" />
            </label>
          </div>

          {!transaction && (
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Parcelas</span>
              <input
                type="number"
                min={1}
                max={60}
                value={form.installments}
                onChange={event => setForm(prev => ({ ...prev, installments: event.target.value }))}
                className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              {installments > 1 && Number.isFinite(amount) && amount > 0 && (
                <span className="mt-1.5 block text-[11px] text-gray-400">Serão criadas {installments} parcelas de aproximadamente R$ {(amount / installments).toFixed(2).replace(".", ",")}.</span>
              )}
            </label>
          )}

          <label className="block">
            <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Status</span>
            <select value={form.status} onChange={event => setForm(prev => ({ ...prev, status: event.target.value as "completed" | "pending" }))} className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none">
              <option value="completed">Concluída</option>
              <option value="pending">Pendente</option>
            </select>
          </label>
        </div>

        <div className="p-5 border-t border-border flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 border border-border py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancelar</button>
          <button onClick={submit} disabled={!canSubmit || saving} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all shadow-sm active:scale-[0.97] bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100">
            {saving ? "Salvando..." : transaction ? "Salvar" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
