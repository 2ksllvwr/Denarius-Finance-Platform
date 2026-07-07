import { IconTrash, IconX } from "@/components/Icons";
import { cn } from "@/utils/cn";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "danger" | "default";
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirmar", tone = "default", onCancel, onConfirm }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in" onClick={onCancel}>
      <div className="bg-card w-full sm:max-w-[420px] border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up" onClick={event => event.stopPropagation()}>
        <div className="p-5 flex items-start gap-4">
          <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0", tone === "danger" ? "bg-danger-50 text-danger-500" : "bg-gray-100 text-gray-700")}>
            <IconTrash size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-[13px] leading-5 text-gray-500">{message}</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg text-gray-300 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center" aria-label="Cancelar">
            <IconX size={16} />
          </button>
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-border rounded-xl py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className={cn("flex-1 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-colors", tone === "danger" ? "bg-danger-500 hover:bg-danger-600" : "bg-gray-900 hover:bg-gray-800")}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
