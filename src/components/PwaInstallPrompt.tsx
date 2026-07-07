import { useEffect, useState } from "react";
import { BrandMark } from "@/components/Brand";
import { IconDownload, IconX } from "@/components/Icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "denarius.installPrompt.dismissedAt";
const DISMISS_DAYS = 14;

function recentlyDismissed() {
  const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
  if (!dismissedAt) return false;
  return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (recentlyDismissed()) return;

      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setInstallEvent(null);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !installEvent) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "dismissed") {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
    setVisible(false);
    setInstallEvent(null);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] sm:left-auto sm:right-5 sm:bottom-5 sm:w-[360px] animate-slide-up">
      <div className="bg-gray-950 text-white border border-white/10 rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <BrandMark className="w-10 h-10 rounded-xl bg-white/10 text-white flex-shrink-0" letterClassName="text-3xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Instalar Denarius</p>
            <p className="mt-1 text-[12px] leading-5 text-white/55">Use em tela cheia, com acesso mais rápido e suporte offline.</p>
          </div>
          <button onClick={dismiss} className="w-8 h-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center" aria-label="Dispensar instalação">
            <IconX size={16} />
          </button>
        </div>
        <button onClick={() => void install()} className="mt-4 w-full bg-white text-gray-950 rounded-xl py-2.5 text-[13px] font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
          <IconDownload size={15} /> Instalar app
        </button>
      </div>
    </div>
  );
}
