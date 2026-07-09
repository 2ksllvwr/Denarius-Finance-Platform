import { useEffect, useState, type ReactNode } from "react";
import { SidebarBrandName } from "@/components/Brand";
import {
  IconBarChart,
  IconBell,
  IconCalendar,
  IconCategories,
  IconChevronLeft,
  IconChevronRight,
  IconDashboard,
  IconLogout,
  IconPlus,
  IconSettings,
  IconTrash,
  IconWallet,
} from "@/components/Icons";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import type { AppNotification, Page, User } from "@/data/types";
import { cn } from "@/utils/cn";

interface LayoutProps {
  page: Page;
  user: User;
  mode: "api" | "local";
  notifications: AppNotification[];
  selectedMonth: string;
  selectedMonthLabel: string;
  onPageChange: (page: Page) => void;
  onMonthChange: (month: string) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onNewTransaction: () => void;
  onLogout: () => void;
  onMarkNotificationsRead: () => void;
  onClearNotifications: () => void;
  children: ReactNode;
}

const NAV_GROUPS = [
  {
    label: "Visão geral",
    items: [
      { id: "dashboard" as Page, label: "Início", icon: IconDashboard },
      { id: "transactions" as Page, label: "Transações", icon: IconCalendar },
      { id: "insights" as Page, label: "Relatórios", icon: IconBarChart },
    ],
  },
  {
    label: "Organização",
    items: [
      { id: "monthly" as Page, label: "Planejamento", icon: IconCalendar },
      { id: "accounts" as Page, label: "Contas", icon: IconWallet },
      { id: "categories" as Page, label: "Orçamentos", icon: IconCategories },
    ],
  },
];
const NAV = NAV_GROUPS.flatMap(group => group.items);

const PAGE_SUBTITLE: Record<Page, string> = {
  insights: "Análise de receitas e despesas",
  monthly: "Metas, recorrências e fechamento",
  dashboard: "Resumo financeiro do período",
  transactions: "Histórico de movimentações",
  accounts: "Contas, carteiras e cartoes",
  categories: "Limites e categorias",
  billing: "Planos e assinatura",
  settings: "Configure sua conta",
};

function formatNotificationTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(date));
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function parseMonthValue(value: string) {
  const [yearValue, monthValue] = value.split("-");
  const now = new Date();
  const year = Number(yearValue) || now.getFullYear();
  const monthIndex = Math.min(11, Math.max(0, (Number(monthValue) || now.getMonth() + 1) - 1));
  return { year, monthIndex };
}

function toMonthValue(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

interface SidebarToggleButtonProps {
  open: boolean;
  onClick: () => void;
  className?: string;
  label: string;
}

function SidebarToggleButton({ open, onClick, className, label }: SidebarToggleButtonProps) {
  const lineClass = "absolute left-0 h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <button
      type="button"
      onClick={onClick}
      data-sidebar-toggle="true"
      aria-label={label}
      aria-expanded={open}
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 active:scale-95",
        className,
      )}
    >
      <span className="relative block h-4 w-5" aria-hidden="true">
        <span className={cn(lineClass, open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0")} />
        <span className={cn(lineClass, "top-1/2 -translate-y-1/2", open ? "translate-x-2 opacity-0" : "opacity-100")} />
        <span className={cn(lineClass, open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[14px]")} />
      </span>
    </button>
  );
}

export function Layout({
  page,
  user,
  mode,
  notifications,
  selectedMonth,
  selectedMonthLabel,
  onPageChange,
  onMonthChange,
  onPreviousMonth,
  onNextMonth,
  onNewTransaction,
  onLogout,
  onMarkNotificationsRead,
  onClearNotifications,
  children,
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const selectedMonthParts = parseMonthValue(selectedMonth);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedMonthParts.year);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => (
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied"
  ));

  const unreadCount = notifications.filter(notification => !notification.read).length;

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setMonthPickerOpen(false);
  }, [page]);

  useEffect(() => {
    if (!monthPickerOpen) setPickerYear(selectedMonthParts.year);
  }, [monthPickerOpen, selectedMonthParts.year]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  useEffect(() => {
    if (!monthPickerOpen) return;

    const closeMonthPicker = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-month-picker]")) return;
      setMonthPickerOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMonthPickerOpen(false);
    };

    window.addEventListener("pointerdown", closeMonthPicker);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeMonthPicker);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [monthPickerOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const closeNotifications = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-notifications-root]")) return;
      setNotificationsOpen(false);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    window.addEventListener("pointerdown", closeNotifications);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeNotifications);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-sidebar-root]") || target.closest("[data-sidebar-toggle]")) return;

      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCollapsed(true);
        return;
      }

      setMobileOpen(false);
    };

    window.addEventListener("pointerdown", closeOnOutsideClick);
    return () => window.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed(prev => !prev);
      return;
    }

    setMobileOpen(prev => !prev);
  };

  const openNotifications = () => {
    setProfileOpen(false);
    setNotificationsOpen(prev => {
      const next = !prev;
      if (next) onMarkNotificationsRead();
      return next;
    });
  };

  const openProfile = () => {
    setNotificationsOpen(false);
    setProfileOpen(prev => !prev);
  };

  const goTo = (nextPage: Page) => {
    onPageChange(nextPage);
    setMobileOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    setMonthPickerOpen(false);
  };

  const requestBrowserNotifications = () => {
    if (!("Notification" in window)) return;
    void Notification.requestPermission().then(setBrowserPermission);
  };

  const selectMonth = (monthIndex: number) => {
    onMonthChange(toMonthValue(pickerYear, monthIndex));
    setMonthPickerOpen(false);
  };

  return (
    <div className="flex h-dvh bg-[#f7f8fa] font-sans antialiased overflow-hidden">
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/45 z-40 animate-fade-in backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />}

      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 h-dvh bg-sidebar flex flex-col flex-shrink-0 shadow-2xl lg:shadow-none will-change-transform transition-[transform,width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-r border-white/5",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "w-[min(84vw,320px)] lg:w-[76px]" : "w-[min(84vw,320px)] lg:w-[252px]",
      )} data-sidebar-root="true">
        <div className={cn("h-16 flex items-center justify-between flex-shrink-0", collapsed && !mobileOpen ? "px-4" : "px-5")}>
          <button onClick={() => goTo("dashboard")} className={cn("flex items-center min-w-0", collapsed && !mobileOpen ? "justify-center" : "justify-start")}>
            <SidebarBrandName collapsed={collapsed && !mobileOpen} />
          </button>
          <SidebarToggleButton
            open={mobileOpen}
            onClick={() => setMobileOpen(false)}
            label="Fechar menu"
            className="lg:hidden text-white/45 hover:text-white hover:bg-white/[0.08]"
          />
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? "mt-7" : ""}>
              {(!collapsed || mobileOpen) && <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.12em] text-white/30 uppercase">{group.label}</p>}
              <div className="space-y-1">
                {group.items.map(item => {
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(item.id)}
                      className={cn(
                        "relative w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-colors",
                        collapsed && !mobileOpen ? "justify-center px-0 py-3" : "px-3 py-2.5",
                        active ? "bg-white/[0.10] text-white" : "text-white/55 hover:text-white hover:bg-white/[0.05]",
                      )}
                      title={collapsed && !mobileOpen ? item.label : undefined}
                    >
                      {active && <span className="absolute left-0 w-0.5 h-5 rounded-r bg-white" />}
                      <item.icon size={18} className={active ? "text-white" : "text-white/45"} />
                      {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4 space-y-2">
          {(!collapsed || mobileOpen) && (
            <button onClick={() => goTo("settings")} className="w-full mx-0 p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] transition-colors mb-2 text-left">
              <div className="flex items-center gap-3">
                <ProfileAvatar user={user} className="w-9 h-9 rounded-lg flex-shrink-0" textClassName="text-[11px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-[13px] font-medium truncate">{user.name}</p>
                  {user.title && <p className="text-white/40 text-[11px] truncate">{user.title}</p>}
                </div>
              </div>
            </button>
          )}
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all text-xs">
            <IconLogout size={15} /> {(!collapsed || mobileOpen) && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-[72px] border-b border-border bg-white/92 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarToggleButton
              open={mobileOpen}
              onClick={toggleSidebar}
              label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              className="-ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            />
            <div className="min-w-0">
              <h1 className="text-[15px] sm:text-base font-semibold text-gray-950 truncate">{NAV.find(n => n.id === page)?.label ?? (page === "settings" ? "Configurações" : "Assinatura")}</h1>
              <p className="text-[11px] text-gray-400 hidden sm:block">{PAGE_SUBTITLE[page]}</p>
              <div className="relative sm:hidden mt-1 w-fit" data-month-picker>
                <button
                  onClick={() => setMonthPickerOpen(prev => !prev)}
                  className="flex items-center gap-1 rounded-md py-0.5 pr-1 text-[10px] font-semibold capitalize text-gray-400 hover:text-gray-700"
                  aria-haspopup="dialog"
                  aria-expanded={monthPickerOpen}
                >
                  <IconCalendar size={11} className="text-current" />
                  {selectedMonthLabel}
                </button>
                {monthPickerOpen && (
                  <div className="absolute left-0 top-7 z-40 w-[min(260px,calc(100vw-32px))] rounded-xl border border-border bg-card p-2.5 shadow-xl animate-scale-in">
                    <div className="mb-2.5 flex items-center justify-between">
                      <button onClick={() => setPickerYear(year => year - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700" aria-label="Ano anterior">
                        <IconChevronLeft size={14} />
                      </button>
                      <p className="text-[13px] font-semibold text-gray-900">{pickerYear}</p>
                      <button onClick={() => setPickerYear(year => year + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-700" aria-label="Próximo ano">
                        <IconChevronRight size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTHS.map((month, monthIndex) => {
                        const active = pickerYear === selectedMonthParts.year && monthIndex === selectedMonthParts.monthIndex;
                        return (
                          <button
                            key={month}
                            onClick={() => selectMonth(monthIndex)}
                            className={cn(
                              "rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                              active ? "bg-gray-900 text-white" : "bg-surface text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                            )}
                          >
                            {month}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 bg-surface border border-border rounded-xl p-1">
              <button onClick={onPreviousMonth} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-card flex items-center justify-center" aria-label="Mês anterior">
                <IconChevronLeft size={16} />
              </button>
              <label className="relative">
                <span className="sr-only">Mês atual</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={event => onMonthChange(event.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="block min-w-[132px] px-2 text-center text-[12px] font-semibold text-gray-700 capitalize cursor-pointer">{selectedMonthLabel}</span>
              </label>
              <button onClick={onNextMonth} className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-card flex items-center justify-center" aria-label="Próximo mês">
                <IconChevronRight size={16} />
              </button>
            </div>

            {mode === "local" && <span className="hidden md:block text-[11px] font-medium text-gray-400">Modo offline</span>}

            <div className="relative" data-notifications-root>
              <button onClick={openNotifications} className="flex w-10 h-10 items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all relative" aria-label="Notificações">
                <IconBell size={18} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-danger-500 text-white rounded-full text-[9px] leading-4 font-bold">{Math.min(unreadCount, 9)}</span>}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-[min(360px,calc(100vw-32px))] bg-card border border-border rounded-2xl shadow-xl z-30 overflow-hidden animate-scale-in">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Notificações</p>
                      <p className="text-[11px] text-gray-400">Atualizações recentes</p>
                    </div>
                    <button onClick={onClearNotifications} className="w-8 h-8 rounded-lg text-gray-300 hover:text-danger-500 hover:bg-danger-50 flex items-center justify-center" aria-label="Limpar notificações">
                      <IconTrash size={15} />
                    </button>
                  </div>
                  {browserPermission === "default" && (
                    <button onClick={requestBrowserNotifications} className="w-full px-4 py-3 text-left border-b border-border bg-brand-50/50 hover:bg-brand-50 transition-colors">
                      <p className="text-[13px] font-semibold text-brand-700">Ativar alertas do navegador</p>
                      <p className="text-[11px] text-brand-600 mt-0.5">Receba avisos mesmo com a aba em segundo plano.</p>
                    </button>
                  )}
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-gray-400">Nada novo por enquanto.</p>
                    ) : notifications.map(notification => (
                      <div key={notification.id} className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-gray-50/70 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className={cn(
                            "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                            notification.kind === "warning" ? "bg-warning-500" : notification.kind === "success" ? "bg-success-500" : "bg-brand-500",
                          )} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[13px] font-semibold text-gray-800 truncate">{notification.title}</p>
                              <span className="text-[10px] text-gray-300 flex-shrink-0">{formatNotificationTime(notification.createdAt)}</span>
                            </div>
                            <p className="text-[12px] text-gray-500 mt-0.5 leading-5">{notification.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={onNewTransaction} className="bg-gray-950 text-white pl-2.5 pr-3.5 py-2 rounded-xl text-[13px] font-semibold hover:bg-gray-800 transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.97]">
              <IconPlus size={16} />
              <span className="hidden sm:inline">Nova transação</span>
              <span className="sm:hidden">Nova</span>
            </button>

            <div className="relative hidden sm:block">
              <button onClick={openProfile} className="w-10 h-10 rounded-xl bg-gray-100 hover:ring-2 hover:ring-brand-500/20 transition-all overflow-hidden flex items-center justify-center" aria-label="Perfil">
                <ProfileAvatar user={user} className="w-full h-full rounded-xl" textClassName="text-[11px]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-[min(300px,calc(100vw-32px))] bg-card border border-border rounded-2xl shadow-xl z-30 overflow-hidden animate-scale-in">
                  <div className="p-4 border-b border-border flex items-center gap-3">
                    <ProfileAvatar user={user} className="w-12 h-12 rounded-2xl flex-shrink-0" textClassName="text-sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      {user.title && <p className="text-[11px] text-brand-600 font-medium mt-1 truncate">{user.title}</p>}
                    </div>
                  </div>
                  <div className="p-2">
                    <button onClick={() => goTo("settings")} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50">
                      <IconSettings size={15} /> Editar perfil
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-danger-500 hover:bg-danger-50">
                      <IconLogout size={15} /> Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
