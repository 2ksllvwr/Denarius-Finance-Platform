import { useState } from "react";
import type { Category } from "@/data/types";
import { formatCurrency } from "@/data/types";
import { cn } from "@/utils/cn";
import { IconPlus, IconTrash } from "@/components/Icons";

interface CategoriesPageProps {
  categories: Category[];
  currency: string;
  onAdd: (category: Omit<Category, "id" | "spent">) => Promise<void>;
  onUpdate: (id: string, category: Partial<Omit<Category, "id" | "spent">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function parseCurrencyInput(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function CategoriesPage({ categories, currency, onAdd, onUpdate, onDelete }: CategoriesPageProps) {
  const [form, setForm] = useState({ name: "", icon: "📌", color: "#6366f1", budget: "" });
  const [editingBudget, setEditingBudget] = useState<Record<string, string>>({});

  const add = async () => {
    if (!form.name.trim()) return;
    await onAdd({ name: form.name.trim(), icon: form.icon.trim() || "📌", color: form.color, budget: parseCurrencyInput(form.budget) });
    setForm({ name: "", icon: "📌", color: "#6366f1", budget: "" });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto space-y-5 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-900">Nova categoria</h2>
        <p className="text-[11px] text-gray-400 mt-0.5 mb-4">Crie categorias com orçamento mensal.</p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_110px_120px_auto] gap-3">
          <input value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Nome" className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          <input value={form.icon} onChange={event => setForm(prev => ({ ...prev, icon: event.target.value }))} placeholder="Ícone" className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          <input type="color" value={form.color} onChange={event => setForm(prev => ({ ...prev, color: event.target.value }))} className="h-[42px] bg-surface border border-border rounded-xl px-2" />
          <input value={form.budget} onChange={event => setForm(prev => ({ ...prev, budget: event.target.value }))} inputMode="decimal" placeholder="Orçamento" className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          <button onClick={add} className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-gray-800 flex items-center justify-center gap-2"><IconPlus size={15} /> Criar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(category => {
          const pct = category.budget > 0 ? Math.min(Math.round((category.spent / category.budget) * 100), 100) : 0;
          const budgetValue = editingBudget[category.id] ?? String(category.budget);
          return (
            <div key={category.id} className="bg-card border border-border rounded-2xl p-5 hover:border-border-hover transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg" style={{ backgroundColor: `${category.color}18` }}>{category.icon}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{category.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Gasto: {formatCurrency(category.spent, currency)}</p>
                  </div>
                </div>
                <button onClick={() => void onDelete(category.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-danger-500 hover:bg-danger-50 transition-all"><IconTrash size={15} /></button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-gray-400">Progresso do orçamento</span>
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-md", pct > 90 ? "bg-danger-50 text-danger-500" : pct > 70 ? "bg-warning-50 text-warning-500" : "bg-gray-100 text-gray-500")}>{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-[6px] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : category.color }} /></div>
              </div>

              <div className="mt-4 flex gap-2">
                <input value={budgetValue} onChange={event => setEditingBudget(prev => ({ ...prev, [category.id]: event.target.value }))} inputMode="decimal" className="min-w-0 flex-1 bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
                <button onClick={() => void onUpdate(category.id, { budget: parseCurrencyInput(budgetValue) })} className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-[13px] font-semibold hover:bg-gray-800">Salvar</button>
              </div>
            </div>
          );
        })}
        {categories.length === 0 && (
          <div className="md:col-span-2 bg-card border border-border rounded-2xl p-10 text-center">
            <p className="text-sm font-medium text-gray-700">Nenhuma categoria criada</p>
            <p className="mt-1 text-[12px] text-gray-400">Crie categorias para organizar lançamentos e acompanhar orçamentos mensais.</p>
          </div>
        )}
      </div>
    </div>
  );
}
