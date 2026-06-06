import { useEffect, useState, type ReactNode } from "react";
import { BrandMark, BrandName } from "@/components/Brand";
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
  IconTransactions,
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

const NAV = [
  { id: "dashboard" as Page, label: "Painel", icon: IconDashboard },
  { id: "monthly" as Page, label: "Mensal", icon: IconCalendar },
  { id: "transactions" as Page, label: "Transações", icon: IconTransactions },
  { id: "categories" as Page, label: "Categorias", icon: IconCategories },
  { id: "billing" as Page, label: "Planos", icon: IconBarChart },
  { id: "settings" as Page, label: "Ajustes", icon: IconSettings },
];

const PAGE_SUBTITLE: Record<Page, string> = {
  monthly: "Planejamento e fechamento do mÃªs",
  dashboard: "Visão geral das suas finanças",
  transactions: "Gerencie suas movimentações",
  categories: "Acompanhe seus orçamentos",
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
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => (
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied"
  ));

  const unreadCount = notifications.filter(notification => !notification.read).length;

  useEffect(() => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [page]);

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
  };

  const requestBrowserNotifications = () => {
    if (!("Notification" in window)) return;
    void Notification.requestPermission().then(setBrowserPermission);
  };

  return (
    <div className="flex h-dvh bg-surface font-sans antialiased overflow-hidden">
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/45 z-40 animate-fade-in backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />}

      <aside className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 h-dvh bg-sidebar flex flex-col flex-shrink-0 shadow-2xl lg:shadow-none will-change-transform transition-[transform,width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "w-[min(84vw,320px)] lg:w-[76px]" : "w-[min(84vw,320px)] lg:w-[252px]",
      )} data-sidebar-root="true">
        <div className="h-16 flex items-center justify-between px-4 flex-shrink-0">
          <button onClick={() => goTo("dashboard")} className="flex items-center gap-3 min-w-0">
            <BrandMark className="w-9 h-9 rounded-xl bg-white/10 text-white flex-shrink-0" letterClassName="text-3xl" />
            {(!collapsed || mobileOpen) && <BrandName className="text-white text-[17px]" />}
          </button>
          <SidebarToggleButton
            open={mobileOpen}
            onClick={() => setMobileOpen(false)}
            label="Fechar menu"
            className="lg:hidden text-white/45 hover:text-white hover:bg-white/[0.08]"
          />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {(!collapsed || mobileOpen) && <p className="text-[11px] font-medium text-white/30 uppercase px-3 mb-3">Menu</p>}
          {NAV.map(item => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-150",
                  collapsed && !mobileOpen ? "justify-center px-0 py-3" : "px-3 py-2.5",
                  active ? "bg-white/[0.12] text-white shadow-sm" : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]",
                )}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <item.icon size={19} className={active ? "text-white" : "text-white/40"} />
                {(!collapsed || mobileOpen) && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-2">
          {(!collapsed || mobileOpen) && (
            <button onClick={() => goTo("settings")} className="w-full mx-0 p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] transition-colors mb-2 text-left">
              <div className="flex items-center gap-3">
                <ProfileAvatar user={user} className="w-9 h-9 rounded-lg flex-shrink-0" textClassName="text-[11px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-[13px] font-medium truncate">{user.name}</p>
                  <p className="text-white/40 text-[11px] truncate">{user.title || `Plano ${user.plan}`}</p>
                </div>
              </div>
            </button>
          )}
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all text-xs">
            <IconLogout size={15} /> {(!collapsed || mobileOpen) && <span>Sair</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex w-full items-center justify-center gap-2 py-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all text-xs">
            {collapsed ? <IconChevronRight size={16} /> : <><IconChevronLeft size={16} /><span>Recolher</span></>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarToggleButton
              open={mobileOpen}
              onClick={toggleSidebar}
              label={mobileOpen ? "Fechar menu" : "Abrir menu"}
              className="-ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            />
            <div className="min-w-0">
              <h1 className="text-[15px] sm:text-base font-semibold text-gray-900 truncate">{NAV.find(n => n.id === page)?.label}</h1>
              <p className="text-[11px] text-gray-400 hidden sm:block">{PAGE_SUBTITLE[page]}</p>
              <label className="relative sm:hidden block w-fit">
                <span className="sr-only">Mês atual</span>
                <input type="month" value={selectedMonth} onChange={event => onMonthChange(event.target.value)} className="absolute inset-0 opacity-0" />
                <span className="text-[10px] text-brand-600 font-semibold capitalize">{selectedMonthLabel}</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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

            <div className={cn("hidden md:flex items-center rounded-full px-3 py-1.5 text-[11px] font-medium", mode === "api" ? "bg-success-50 text-success-600" : "bg-warning-50 text-warning-500")}>
              {mode === "api" ? "API conectada" : "Offline ativo"}
            </div>

            <div className="relative">
              <button onClick={openNotifications} className="flex w-10 h-10 items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all relative" aria-label="Notificações">
                <IconBell size={18} />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-danger-500 text-white rounded-full text-[9px] leading-4 font-bold">{Math.min(unreadCount, 9)}</span>}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-[min(360px,calc(100vw-32px))] bg-card border border-border rounded-2xl shadow-xl z-30 overflow-hidden animate-scale-in">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Notificações</p>
                      <p className="text-[11px] text-gray-400">Atualizações em tempo real</p>
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

            <button onClick={onNewTransaction} className="bg-gray-900 text-white pl-2.5 pr-3.5 py-2 rounded-xl text-[13px] font-medium hover:bg-gray-800 transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.97]">
              <IconPlus size={16} />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </button>

            <div className="relative">
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
                    <button onClick={() => goTo("billing")} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50">
                      <IconBarChart size={15} /> Plano {user.plan}
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
