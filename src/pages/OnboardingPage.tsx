import { useState } from "react";
import { BrandMark, BrandName } from "@/components/Brand";
import { IconCheck, IconShield, IconWallet } from "@/components/Icons";
import type { Settings, User } from "@/data/types";
import type { OnboardingInput } from "@/hooks/useFinanceApp";

interface OnboardingPageProps {
  user: User;
  currency: Settings["currency"];
  onComplete: (input: OnboardingInput) => Promise<void>;
  onLogout: () => void;
}

function parseAmount(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

export function OnboardingPage({ user, currency, onComplete, onLogout }: OnboardingPageProps) {
  const [form, setForm] = useState({
    currency,
    savingsTarget: "",
    spendingLimit: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    await onComplete({
      currency: form.currency,
      savingsTarget: parseAmount(form.savingsTarget) || 0,
      spendingLimit: parseAmount(form.spendingLimit) || 0,
      notes: form.notes,
    });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="p-6 sm:p-10 flex flex-col justify-between bg-[radial-gradient(circle_at_20%_10%,#3b6cf544,transparent_34%),linear-gradient(145deg,#111,#050505)]">
        <div className="flex items-center gap-3">
          <BrandMark className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 text-white" letterClassName="text-3xl" />
          <div>
            <BrandName className="text-white" />
            <p className="text-xs text-white/40">Configuração inicial</p>
          </div>
        </div>

        <div className="py-16 lg:py-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/60">
            <IconShield size={14} /> Offline-first
          </p>
          <h1 className="mt-6 max-w-xl text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
            Ajuste seu mês antes do primeiro lançamento.
          </h1>
          <p className="mt-5 max-w-lg text-sm sm:text-base leading-7 text-white/55">
            Olá, {user.name}. Em menos de um minuto o DENARIUS cria suas metas iniciais e deixa seu painel pronto para acompanhamento mensal.
          </p>
        </div>

        <button onClick={onLogout} className="w-fit text-xs text-white/35 hover:text-white/70 transition-colors">Sair da conta</button>
      </section>

      <section className="bg-surface text-gray-900 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-[560px] bg-card border border-border rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-5">
            <IconWallet size={22} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Primeira organização mensal</h2>
          <p className="text-sm text-gray-400 mt-2">Esses valores podem ser alterados depois na seção Mensal.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Moeda padrão</span>
              <select value={form.currency} onChange={event => setForm(prev => ({ ...prev, currency: event.target.value as Settings["currency"] }))} className="w-full bg-surface border border-border rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Meta de saldo</span>
              <input inputMode="decimal" value={form.savingsTarget} onChange={event => setForm(prev => ({ ...prev, savingsTarget: event.target.value }))} placeholder="0,00" className="w-full bg-surface border border-border rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </label>
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Limite de gastos</span>
              <input inputMode="decimal" value={form.spendingLimit} onChange={event => setForm(prev => ({ ...prev, spendingLimit: event.target.value }))} placeholder="0,00" className="w-full bg-surface border border-border rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Prioridade do mês</span>
              <textarea value={form.notes} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} rows={4} placeholder="Ex: reduzir gastos variáveis e manter reserva..." className="w-full resize-none bg-surface border border-border rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </label>
          </div>

          <button onClick={() => void finish()} disabled={saving} className="mt-6 w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            <IconCheck size={16} /> {saving ? "Configurando..." : "Entrar no DENARIUS"}
          </button>
        </div>
      </section>
    </div>
  );
}
