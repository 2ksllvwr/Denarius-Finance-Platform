import { useState, type FormEvent } from "react";
import { BrandMark, BrandName } from "@/components/Brand";
import { cn } from "@/utils/cn";
import { IconBarChart, IconCheck, IconMail, IconShield, IconUser } from "@/components/Icons";

type AuthMode = "login" | "register" | "forgot" | "verify-register" | "verify-reset" | "reset-password";

interface AuthScreenProps {
  loading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, verificationToken: string) => Promise<void>;
  onRequestEmailCode: (email: string, purpose: "register" | "reset") => Promise<void>;
  onVerifyEmailCode: (email: string, code: string, purpose: "register" | "reset") => Promise<string>;
  onResetPassword: (email: string, password: string, verificationToken: string) => Promise<void>;
}

export function AuthScreen({
  loading,
  error,
  onLogin,
  onRegister,
  onRequestEmailCode,
  onVerifyEmailCode,
  onResetPassword,
}: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const showMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setLocalError(null);
    setMessage(null);
    setCode("");
    setVerificationToken("");
  };

  const validatePasswords = () => {
    if (password.length < 6) {
      setLocalError("A senha precisa ter pelo menos 6 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError("As senhas precisam ser iguais.");
      return false;
    }
    return true;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setMessage(null);

    try {
      if (mode === "login") {
        await onLogin(email, password);
        return;
      }
      if (mode === "register") {
        if (!name.trim()) throw new Error("Informe seu nome.");
        if (!validatePasswords()) return;
        await onRequestEmailCode(email, "register");
        setMode("verify-register");
        setMessage("Enviamos um código de seis dígitos para o seu e-mail.");
        return;
      }
      if (mode === "forgot") {
        await onRequestEmailCode(email, "reset");
        setMode("verify-reset");
        setMessage("Enviamos um código de seis dígitos para o seu e-mail.");
        return;
      }
      if (mode === "verify-register") {
        const token = await onVerifyEmailCode(email, code, "register");
        await onRegister(name, email, password, token);
        return;
      }
      if (mode === "verify-reset") {
        const token = await onVerifyEmailCode(email, code, "reset");
        setVerificationToken(token);
        setPassword("");
        setConfirmPassword("");
        setMode("reset-password");
        setMessage("E-mail confirmado. Agora defina sua nova senha.");
        return;
      }
      if (!validatePasswords()) return;
      await onResetPassword(email, password, verificationToken);
      setPassword("");
      setConfirmPassword("");
      setMode("login");
      setMessage("Senha alterada. Você já pode entrar na sua conta.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Não foi possível continuar.");
    }
  };

  const resendCode = async () => {
    const purpose = mode === "verify-register" ? "register" : "reset";
    setLocalError(null);
    try {
      await onRequestEmailCode(email, purpose);
      setMessage("Um novo código foi enviado.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Não foi possível reenviar o código.");
    }
  };

  const isVerification = mode === "verify-register" || mode === "verify-reset";
  const title = mode === "login" ? "Entrar na conta"
    : mode === "register" ? "Criar sua conta"
      : mode === "forgot" ? "Recuperar acesso"
        : isVerification ? "Confirme seu e-mail"
          : "Criar nova senha";
  const description = mode === "login" ? "Use seu e-mail e senha."
    : mode === "register" ? "Informe seus dados para começar."
      : mode === "forgot" ? "Enviaremos um código para o e-mail cadastrado."
        : isVerification ? `Digite o código enviado para ${email}.`
          : "Escolha uma senha com pelo menos seis caracteres.";

  return (
    <div className="min-h-screen bg-gray-950 text-white grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden lg:flex flex-col justify-between p-10 bg-[radial-gradient(circle_at_top_left,#3156ff33,transparent_35%),linear-gradient(135deg,#111,#050505)]">
        <div className="flex items-center gap-3">
          <BrandMark className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 text-white" letterClassName="text-3xl" />
          <div><p><BrandName /></p><p className="text-xs text-white/40">Finance SaaS</p></div>
        </div>
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs text-white/60 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 mb-5">
            <IconShield size={14} /> Conta protegida neste dispositivo
          </div>
          <h1 className="text-5xl font-semibold tracking-tight leading-tight">Controle financeiro com login próprio.</h1>
          <p className="text-white/55 mt-5 text-base leading-7">Cadastre sua conta, entre com e-mail e senha e continue acessando seus dados mesmo sem conexão.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[["Conta", "e-mail verificado"], ["Offline", "dados salvos"], ["Privado", "por usuário"]].map(([itemTitle, desc]) => (
            <div key={itemTitle} className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
              <IconCheck size={16} className="text-success-500 mb-3" />
              <p className="text-sm font-medium">{itemTitle}</p><p className="text-xs text-white/40 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-8 bg-surface text-gray-900">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BrandMark className="w-10 h-10 rounded-2xl bg-gray-900 text-white" letterClassName="text-3xl" />
            <div><p><BrandName /></p><p className="text-xs text-gray-400">Finance SaaS</p></div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 sm:p-7 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-gray-900 text-white flex items-center justify-center mb-5"><IconBarChart size={20} /></div>

            {(mode === "login" || mode === "register") && (
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1 border border-border mb-6">
                <button type="button" onClick={() => showMode("login")} className={cn("rounded-xl py-2.5 text-sm font-semibold transition-all", mode === "login" ? "bg-card text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700")}>Entrar</button>
                <button type="button" onClick={() => showMode("register")} className={cn("rounded-xl py-2.5 text-sm font-semibold transition-all", mode === "register" ? "bg-card text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700")}>Criar conta</button>
              </div>
            )}

            {mode !== "login" && mode !== "register" && (
              <button type="button" onClick={() => showMode("login")} className="mb-5 text-xs font-medium text-gray-400 hover:text-gray-800">← Voltar para o login</button>
            )}

            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-gray-400 mt-2">{description}</p>

            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "register" && (
                <Field label="Nome"><IconUser size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" /><input value={name} onChange={event => setName(event.target.value)} autoComplete="name" className="input-auth pl-9" /></Field>
              )}

              {(mode === "login" || mode === "register" || mode === "forgot") && (
                <Field label="E-mail"><IconMail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" /><input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" required className="input-auth pl-9" /></Field>
              )}

              {(mode === "login" || mode === "register" || mode === "reset-password") && (
                <Field label={mode === "reset-password" ? "Nova senha" : "Senha"}><input value={password} onChange={event => setPassword(event.target.value)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required className="input-auth px-3" /></Field>
              )}

              {(mode === "register" || mode === "reset-password") && (
                <Field label="Confirmar senha"><input value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" required className="input-auth px-3" /></Field>
              )}

              {isVerification && (
                <Field label="Código de verificação">
                  <input value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" required className="input-auth px-3 text-center text-xl font-semibold tracking-[0.3em] tabular-nums" />
                </Field>
              )}

              {mode === "login" && (
                <div className="flex justify-end"><button type="button" onClick={() => showMode("forgot")} className="text-xs font-medium text-gray-500 hover:text-gray-900">Esqueceu a senha?</button></div>
              )}

              {(error || localError) && <div className="rounded-xl bg-danger-50 border border-danger-100 text-danger-600 text-xs p-3">{localError ?? error}</div>}
              {message && <div className="rounded-xl bg-success-50 border border-success-100 text-success-600 text-xs p-3">{message}</div>}

              <button type="submit" disabled={loading} className={cn("w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-semibold transition-all hover:bg-gray-800", loading && "opacity-60 cursor-wait")}>
                {loading ? "Carregando..." : mode === "login" ? "Entrar" : mode === "register" ? "Enviar código" : mode === "forgot" ? "Recuperar senha" : isVerification ? "Confirmar código" : "Salvar nova senha"}
              </button>

              {isVerification && <button type="button" disabled={loading} onClick={resendCode} className="w-full py-1 text-xs font-medium text-gray-400 hover:text-gray-800 disabled:opacity-50">Reenviar código</button>}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-gray-400 block mb-1.5">{label}</span>
      <div className="relative">{children}</div>
    </label>
  );
}
