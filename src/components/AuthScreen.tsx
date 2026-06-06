import { useState, type FormEvent } from "react";
import { BrandMark, BrandName } from "@/components/Brand";
import { cn } from "@/utils/cn";
import { IconBarChart, IconCheck, IconMail, IconShield, IconUser } from "@/components/Icons";

interface AuthScreenProps {
  loading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

export function AuthScreen({ loading, error, onLogin, onRegister }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    if (mode === "register" && password !== confirmPassword) {
      setLocalError("As senhas precisam ser iguais.");
      return;
    }

    try {
      if (mode === "login") await onLogin(email, password);
      else await onRegister(name, email, password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Não foi possível continuar.");
    }
  };

  const changeMode = (nextMode: "login" | "register") => {
    setMode(nextMode);
    setLocalError(null);
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden lg:flex flex-col justify-between p-10 bg-[radial-gradient(circle_at_top_left,#3156ff33,transparent_35%),linear-gradient(135deg,#111,#050505)]">
        <div className="flex items-center gap-3">
          <BrandMark className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 text-white" letterClassName="text-3xl" />
          <div>
            <p><BrandName /></p>
            <p className="text-xs text-white/40">Finance SaaS</p>
          </div>
        </div>

        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs text-white/60 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 mb-5">
            <IconShield size={14} /> Conta protegida neste dispositivo
          </div>
          <h1 className="text-5xl font-semibold tracking-tight leading-tight">Controle financeiro com login próprio.</h1>
          <p className="text-white/55 mt-5 text-base leading-7">
            Cadastre sua conta, entre com e-mail e senha e continue acessando seus dados mesmo sem conexão.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ["Conta", "e-mail e senha"],
            ["Offline", "dados salvos"],
            ["Privado", "por usuário"],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
              <IconCheck size={16} className="text-success-500 mb-3" />
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-white/40 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-8 bg-surface text-gray-900">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BrandMark className="w-10 h-10 rounded-2xl bg-gray-900 text-white" letterClassName="text-3xl" />
            <div>
              <p><BrandName /></p>
              <p className="text-xs text-gray-400">Finance SaaS</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-5">
              <IconBarChart size={20} />
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1 border border-border mb-6">
              <button
                type="button"
                onClick={() => changeMode("login")}
                className={cn("rounded-xl py-2.5 text-sm font-semibold transition-all", mode === "login" ? "bg-card text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700")}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => changeMode("register")}
                className={cn("rounded-xl py-2.5 text-sm font-semibold transition-all", mode === "register" ? "bg-card text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700")}
              >
                Criar conta
              </button>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">{mode === "login" ? "Entrar na conta" : "Criar sua conta"}</h2>
            <p className="text-sm text-gray-400 mt-2">
              {mode === "login" ? "Use seu e-mail e senha." : "Informe seus dados para começar."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "register" && (
                <label className="block">
                  <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Nome</span>
                  <div className="relative">
                    <IconUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      value={name}
                      onChange={event => setName(event.target.value)}
                      autoComplete="name"
                      className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="text-[11px] font-medium text-gray-400 block mb-1.5">E-mail</span>
                <div className="relative">
                  <IconMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Senha</span>
                <input
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </label>

              {mode === "register" && (
                <label className="block">
                  <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Confirmar senha</span>
                  <input
                    value={confirmPassword}
                    onChange={event => setConfirmPassword(event.target.value)}
                    type="password"
                    autoComplete="new-password"
                    className="w-full bg-surface border border-border rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </label>
              )}

              {(error || localError) && (
                <div className="rounded-xl bg-danger-50 border border-danger-100 text-danger-600 text-xs p-3">
                  {localError ?? error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn("w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-semibold transition-all hover:bg-gray-800", loading && "opacity-60 cursor-wait")}
              >
                {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
