import { useState } from "react";
import { BrandMark, BrandName } from "@/components/Brand";
import { IconShield } from "@/components/Icons";

interface LockScreenProps {
  userName: string;
  onUnlock: (pin: string) => Promise<boolean>;
  onLogout: () => void;
}

export function LockScreen({ userName, onUnlock, onLogout }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const unlock = async () => {
    setLoading(true);
    setError("");
    const valid = await onUnlock(pin);
    setLoading(false);

    if (!valid) {
      setError("PIN incorreto.");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-5">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <BrandMark className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 text-white" letterClassName="text-3xl" />
          <BrandName className="text-white" />
        </div>

        <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-5">
            <IconShield size={22} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessão bloqueada</h1>
          <p className="text-sm text-white/45 mt-2">Digite seu PIN local para continuar, {userName}.</p>

          <input
            value={pin}
            onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
            onKeyDown={event => { if (event.key === "Enter") void unlock(); }}
            inputMode="numeric"
            type="password"
            autoFocus
            className="mt-6 w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
          />
          {error && <p className="mt-3 text-xs text-danger-500 bg-danger-50/10 border border-danger-500/20 rounded-xl px-3 py-2">{error}</p>}

          <button onClick={() => void unlock()} disabled={pin.length < 4 || loading} className="mt-4 w-full bg-white text-gray-950 rounded-xl py-3 text-sm font-semibold hover:bg-white/90 disabled:opacity-40 transition-all">
            {loading ? "Verificando..." : "Desbloquear"}
          </button>
          <button onClick={onLogout} className="mt-4 w-full text-xs text-white/35 hover:text-white/70 transition-colors">Sair da conta</button>
        </div>
      </div>
    </div>
  );
}
