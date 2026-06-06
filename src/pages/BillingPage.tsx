import type { User } from "@/data/types";
import { formatCurrency } from "@/data/types";
import { cn } from "@/utils/cn";
import { IconCheck, IconShield } from "@/components/Icons";

interface BillingPageProps {
  currentPlan: User["plan"];
  onChangePlan: (plan: User["plan"]) => Promise<void>;
}

const plans: Array<{ id: User["plan"]; name: string; price: number; description: string; features: string[] }> = [
  { id: "Free", name: "Free", price: 0, description: "Para testar o produto", features: ["Até 50 transações", "Categorias básicas", "Exportação CSV"] },
  { id: "Pro", name: "Pro", price: 29.9, description: "Para uso pessoal completo", features: ["Transações ilimitadas", "Orçamentos mensais", "Exportação CSV/PDF", "Relatórios"] },
  { id: "Business", name: "Business", price: 79.9, description: "Base preparada para times", features: ["Multiusuário preparado", "Relatórios avançados", "Suporte prioritário", "Permissões futuras"] },
];

export function BillingPage({ currentPlan, onChangePlan }: BillingPageProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-5 animate-fade-in">
      <div className="bg-gray-900 text-white rounded-3xl p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#3b6cf544,transparent_35%)]" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs text-white/70 mb-4"><IconShield size={14} /> Módulo de assinatura preparado</div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Planos do DENARIUS</h2>
          <p className="text-sm text-white/55 mt-2 leading-6">A troca de plano fica salva na sua conta deste dispositivo. O checkout permanece como ponto de integração para Stripe, Mercado Pago ou outro gateway.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const active = currentPlan === plan.id;
          return (
            <div key={plan.id} className={cn("bg-card border rounded-3xl p-5 flex flex-col", active ? "border-gray-900 shadow-sm" : "border-border")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
                </div>
                {active && <span className="rounded-full bg-success-50 text-success-600 px-2.5 py-1 text-[11px] font-semibold">Atual</span>}
              </div>

              <div className="mt-6">
                <span className="text-3xl font-bold tracking-tight">{formatCurrency(plan.price)}</span>
                <span className="text-xs text-gray-400">/mês</span>
              </div>

              <div className="mt-6 space-y-3 flex-1">
                {plan.features.map(feature => <div key={feature} className="flex items-center gap-2 text-sm text-gray-600"><IconCheck size={15} className="text-success-500" /> {feature}</div>)}
              </div>

              <button onClick={() => void onChangePlan(plan.id)} disabled={active} className={cn("mt-6 rounded-xl py-3 text-sm font-semibold transition-all", active ? "bg-gray-100 text-gray-400 cursor-default" : "bg-gray-900 text-white hover:bg-gray-800")}>{active ? "Plano atual" : "Selecionar plano"}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
