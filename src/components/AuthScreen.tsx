import { useState, type FormEvent, type ReactNode } from "react";
import { BrandName } from "@/components/Brand";
import { IconBarChart, IconChevronRight, IconMail, IconShield, IconUser } from "@/components/Icons";
import { cn } from "@/utils/cn";

type AuthMode = "choice" | "login" | "register" | "forgot" | "verify-register" | "verify-reset" | "reset-password";

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
  const [mode, setMode] = useState<AuthMode>("choice");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hasForm = mode !== "choice";
  const isVerification = mode === "verify-register" || mode === "verify-reset";

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
        setMessage("Enviamos um codigo de seis digitos para o seu e-mail.");
        return;
      }
      if (mode === "forgot") {
        await onRequestEmailCode(email, "reset");
        setMode("verify-reset");
        setMessage("Enviamos um codigo de seis digitos para o e-mail cadastrado.");
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
      setMessage("Senha alterada. Voce ja pode entrar na sua conta.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Nao foi possivel continuar.");
    }
  };

  const resendCode = async () => {
    const purpose = mode === "verify-register" ? "register" : "reset";
    setLocalError(null);
    try {
      await onRequestEmailCode(email, purpose);
      setMessage("Um novo codigo foi enviado.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Nao foi possivel reenviar o codigo.");
    }
  };

  const title = mode === "login" ? "Entrar na conta"
    : mode === "register" ? "Criar conta"
      : mode === "forgot" ? "Recuperar acesso"
        : isVerification ? "Confirme seu e-mail"
          : "Criar nova senha";
  const description = mode === "login" ? "Acesse seu painel financeiro com seguranca."
    : mode === "register" ? "Crie seu acesso e confirme o e-mail para continuar."
      : mode === "forgot" ? "Enviaremos um codigo para validar sua identidade."
        : isVerification ? `Digite o codigo enviado para ${email}.`
          : "Escolha uma senha com pelo menos seis caracteres.";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07090d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(49,95,206,0.18),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(16,185,129,0.08),transparent_26%),linear-gradient(135deg,#0a0d13_0%,#0d1118_52%,#050608_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="absolute -left-32 top-1/3 h-80 w-80 rounded-full border border-white/[0.05]" />
      <div className="absolute right-[-12%] top-[-18%] h-[520px] w-[520px] rounded-full border border-white/[0.06] bg-white/[0.012]" />

      <main
        className={cn(
          "relative z-10 mx-auto flex min-h-screen w-full flex-col px-5 py-6 sm:px-8 lg:px-10",
          hasForm ? "max-w-[980px] items-center justify-center gap-8 lg:grid lg:grid-cols-[420px_430px] lg:items-center lg:gap-16" : "max-w-[1120px] items-center justify-center",
        )}
      >
        <section className={cn("flex w-full flex-col", hasForm ? "max-w-[420px] items-start text-left" : "max-w-3xl items-center text-center")}>
          <div className={cn("flex flex-col", hasForm ? "mb-8 items-start" : "mb-16 items-center")}>
            <div className="text-left">
              <p><BrandName className={cn("text-white", hasForm ? "text-[38px]" : "text-[58px]")} /></p>
            </div>
          </div>

          <div className={cn(hasForm ? "max-w-[420px]" : "max-w-3xl py-10 lg:py-0")}>
            <div className={cn("mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs text-white/60", !hasForm && "mx-auto")}>
              <IconShield size={14} /> Conta protegida e dados sincronizados
            </div>
            <h1 className={cn("font-semibold leading-[1.03] tracking-[-0.055em] text-white", hasForm ? "max-w-[420px] text-4xl lg:text-[42px]" : "mx-auto max-w-3xl text-4xl sm:text-6xl lg:text-[72px]")}>
              Financeiro claro para decisoes melhores.
            </h1>
            <p className={cn("mt-6 text-sm leading-7 text-white/55", hasForm ? "max-w-[390px]" : "mx-auto max-w-2xl sm:text-base")}>
              Acompanhe entradas, despesas, recorrencias e metas em um painel privado, organizado e pronto para uso profissional.
            </p>

            {!hasForm && (
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => showMode("login")}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-950 shadow-2xl shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-white/95"
                >
                  Entrar <IconChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => showMode("register")}
                  className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/[0.10]"
                >
                  Registrar
                </button>
              </div>
            )}
          </div>

          {!hasForm && (
            <div className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/42">
              {["E-mail verificado", "Dados preservados", "Acesso privado por usuario"].map(item => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                  {item}
                </span>
              ))}
            </div>
          )}
        </section>

        {hasForm && (
          <section className="flex w-full items-center justify-center">
            <div key={mode} className="w-full max-w-[430px] animate-auth-panel-down rounded-3xl border border-white/10 bg-white/95 p-5 text-gray-950 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-950 text-white"><IconBarChart size={20} /></div>
                <button type="button" onClick={() => showMode("choice")} className="text-xs font-semibold text-gray-400 transition-colors hover:text-gray-900">
                  Fechar
                </button>
              </div>

              {(mode === "login" || mode === "register") && (
                <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
                  <button type="button" onClick={() => showMode("login")} className={cn("rounded-lg py-2.5 text-sm font-semibold transition-all", mode === "login" ? "bg-card text-gray-950 shadow-sm" : "text-gray-400 hover:text-gray-700")}>Entrar</button>
                  <button type="button" onClick={() => showMode("register")} className={cn("rounded-lg py-2.5 text-sm font-semibold transition-all", mode === "register" ? "bg-card text-gray-950 shadow-sm" : "text-gray-400 hover:text-gray-700")}>Registrar</button>
                </div>
              )}

              {mode !== "login" && mode !== "register" && (
                <button type="button" onClick={() => showMode("login")} className="mb-5 text-xs font-semibold text-gray-400 hover:text-gray-900">Voltar para o login</button>
              )}

              <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>

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
                  <Field label="Codigo de verificacao">
                    <input value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" required className="input-auth px-3 text-center text-xl font-semibold tracking-[0.3em] tabular-nums" />
                  </Field>
                )}

                {mode === "login" && (
                  <div className="flex justify-end"><button type="button" onClick={() => showMode("forgot")} className="text-xs font-semibold text-gray-500 hover:text-gray-950">Esqueceu a senha?</button></div>
                )}

                {(error || localError) && <div className="rounded-xl border border-danger-100 bg-danger-50 p-3 text-xs text-danger-600">{localError ?? error}</div>}
                {message && <div className="rounded-xl border border-success-100 bg-success-50 p-3 text-xs text-success-600">{message}</div>}

                <button type="submit" disabled={loading} className={cn("w-full rounded-xl bg-gray-950 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.99]", loading && "cursor-wait opacity-60")}>
                  {loading ? "Carregando..." : mode === "login" ? "Entrar" : mode === "register" ? "Enviar codigo" : mode === "forgot" ? "Recuperar senha" : isVerification ? "Confirmar codigo" : "Salvar nova senha"}
                </button>

                {isVerification && <button type="button" disabled={loading} onClick={resendCode} className="w-full py-1 text-xs font-semibold text-gray-400 hover:text-gray-800 disabled:opacity-50">Reenviar codigo</button>}
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold text-gray-400">{label}</span>
      <div className="relative">{children}</div>
    </label>
  );
}
