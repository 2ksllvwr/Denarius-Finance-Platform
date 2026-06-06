import { useEffect, useId, useState } from "react";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { IconCheck, IconDownload, IconTrash, IconUser } from "@/components/Icons";
import type { ProfileInput, Settings, User } from "@/data/types";
import { cn } from "@/utils/cn";

interface SettingsPageProps {
  user: User;
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
  onUpdateProfile: (profile: ProfileInput) => Promise<void>;
  onClear: () => Promise<void>;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

const profileFromUser = (user: User): ProfileInput => ({
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  title: user.title ?? "",
  phone: user.phone ?? "",
  bio: user.bio ?? "",
});

export function SettingsPage({ user, settings, onSave, onUpdateProfile, onClear, onExportCsv, onExportPdf }: SettingsPageProps) {
  const fileInputId = useId();
  const [draftSettings, setDraftSettings] = useState(settings);
  const [draftProfile, setDraftProfile] = useState<ProfileInput>(() => profileFromUser(user));
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => setDraftSettings(settings), [settings]);
  useEffect(() => setDraftProfile(profileFromUser(user)), [user]);

  const save = async () => {
    setProfileError(null);
    try {
      await onUpdateProfile(draftProfile);
      await onSave(draftSettings);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Não foi possível salvar o perfil.");
    }
  };

  const selectPhoto = (file: File | undefined) => {
    setProfileError(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileError("Escolha um arquivo de imagem.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Use uma imagem de até 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[860px] mx-auto space-y-5 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">Perfil</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Personalize sua conta e foto</p>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5">
          <div className="flex md:flex-col items-center md:items-start gap-4">
            <ProfileAvatar user={{ name: draftProfile.name, avatarUrl: draftProfile.avatarUrl }} className="w-24 h-24 rounded-3xl flex-shrink-0" textClassName="text-2xl" />
            <div className="flex flex-wrap gap-2">
              <label htmlFor={fileInputId} className="cursor-pointer flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-xl text-[12px] font-semibold hover:bg-gray-800 transition-colors">
                <IconUser size={14} /> Foto
              </label>
              <input id={fileInputId} type="file" accept="image/*" className="hidden" onChange={event => selectPhoto(event.target.files?.[0])} />
              {draftProfile.avatarUrl && (
                <button onClick={() => setDraftProfile(prev => ({ ...prev, avatarUrl: undefined }))} className="flex items-center gap-2 border border-border px-3 py-2 rounded-xl text-[12px] font-semibold text-gray-500 hover:bg-gray-50">
                  <IconTrash size={14} /> Remover
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Nome</span>
              <input value={draftProfile.name} onChange={event => setDraftProfile(prev => ({ ...prev, name: event.target.value }))} className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">E-mail</span>
              <input value={draftProfile.email} type="email" onChange={event => setDraftProfile(prev => ({ ...prev, email: event.target.value }))} className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Cargo ou título</span>
              <input value={draftProfile.title} onChange={event => setDraftProfile(prev => ({ ...prev, title: event.target.value }))} placeholder="Ex: Fundador, Financeiro" className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-gray-300" />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Telefone</span>
              <input value={draftProfile.phone} onChange={event => setDraftProfile(prev => ({ ...prev, phone: event.target.value }))} placeholder="(00) 00000-0000" className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-gray-300" />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Bio</span>
              <textarea value={draftProfile.bio} onChange={event => setDraftProfile(prev => ({ ...prev, bio: event.target.value }))} rows={3} placeholder="Uma nota curta para identificar seu perfil." className="w-full resize-none bg-surface border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-gray-300" />
            </label>

            {profileError && <p className="sm:col-span-2 text-xs text-danger-500 bg-danger-50 border border-danger-100 rounded-xl px-3 py-2">{profileError}</p>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">Preferências</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Configure notificações e moeda</p>
        </div>
        <div className="divide-y divide-border">
          {[
            { key: "notifEmail" as const, label: "Notificações por email", desc: "Receba relatórios semanais e alertas" },
            { key: "notifBudget" as const, label: "Alerta de orçamento", desc: "Avise quando atingir 80% do limite" },
          ].map(pref => (
            <div key={pref.key} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-800">{pref.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{pref.desc}</p>
              </div>
              <button onClick={() => setDraftSettings(prev => ({ ...prev, [pref.key]: !prev[pref.key] }))} className={cn("w-11 h-6 rounded-full relative transition-all duration-200 flex-shrink-0", draftSettings[pref.key] ? "bg-brand-500" : "bg-gray-200")}>
                <div className={cn("w-[18px] h-[18px] bg-white rounded-full absolute top-[3px] transition-all duration-200 shadow-sm", draftSettings[pref.key] ? "right-[3px]" : "left-[3px]")} />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-[13px] font-medium text-gray-800">Moeda</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Moeda padrão para exibição</p>
            </div>
            <select value={draftSettings.currency} onChange={event => setDraftSettings(prev => ({ ...prev, currency: event.target.value as Settings["currency"] }))} className="text-[12px] font-medium bg-surface border border-border px-3 py-1.5 rounded-lg text-gray-600">
              <option value="BRL">BRL (R$)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">Dados</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Exporte ou gerencie seus dados</p>
        </div>
        <div className="p-5 flex flex-wrap gap-2.5">
          <button onClick={onExportCsv} className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:border-border-hover transition-all"><IconDownload size={15} /> Exportar CSV</button>
          <button onClick={onExportPdf} className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:border-border-hover transition-all"><IconDownload size={15} /> Exportar PDF</button>
          <button onClick={() => void onClear()} className="flex items-center gap-2 border border-danger-100 text-danger-500 px-4 py-2.5 rounded-xl text-[13px] font-medium hover:bg-danger-50 transition-all"><IconTrash size={15} /> Limpar dados</button>
        </div>
      </div>

      <button onClick={() => void save()} className={cn("w-full py-3 rounded-xl text-[13px] font-semibold transition-all shadow-sm active:scale-[0.98]", saved ? "bg-success-500 text-white" : "bg-gray-900 text-white hover:bg-gray-800")}>
        {saved ? <span className="flex items-center justify-center gap-2"><IconCheck size={16} /> Salvo com sucesso!</span> : "Salvar alterações"}
      </button>
    </div>
  );
}
