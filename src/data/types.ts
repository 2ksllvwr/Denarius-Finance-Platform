export interface User {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Pro" | "Business";
  avatarUrl?: string;
  title?: string;
  phone?: string;
  bio?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  status: "completed" | "pending";
  recurringId?: string;
  recurringMonth?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget: number;
  spent: number;
}

export interface Settings {
  notifEmail: boolean;
  notifBudget: boolean;
  currency: "BRL" | "USD" | "EUR";
}

export interface ProfileInput {
  name: string;
  email: string;
  avatarUrl?: string;
  title?: string;
  phone?: string;
  bio?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  kind: "info" | "success" | "warning";
  createdAt: string;
  read: boolean;
}

export interface MonthlyGoal {
  month: string;
  savingsTarget: number;
  spendingLimit: number;
  notes: string;
  updatedAt: string;
}

export interface MonthlyClosure {
  month: string;
  closedAt: string;
  income: number;
  expense: number;
  balance: number;
  pending: number;
  transactionCount: number;
  notes: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  dayOfMonth: number;
  status: "completed" | "pending";
  active: boolean;
  lastGeneratedMonth?: string;
}

export interface Stats {
  income: number;
  expense: number;
  balance: number;
  pending: number;
  count: number;
}

export interface MonthlyPoint {
  label: string;
  income: number;
  expense: number;
}

export type Page = "dashboard" | "monthly" | "transactions" | "categories" | "settings" | "billing";

export const formatCurrency = (value: number, currency = "BRL") =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));

export const formatDateFull = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "1", description: "Salário", amount: 8500, type: "income", category: "Trabalho", date: "2026-06-05", status: "completed" },
  { id: "2", description: "Aluguel", amount: 2200, type: "expense", category: "Moradia", date: "2026-06-02", status: "completed" },
  { id: "3", description: "Supermercado", amount: 645.3, type: "expense", category: "Alimentação", date: "2026-06-03", status: "completed" },
  { id: "4", description: "Freelance Design", amount: 3200, type: "income", category: "Freelance", date: "2026-06-01", status: "completed" },
  { id: "5", description: "Netflix", amount: 55.9, type: "expense", category: "Entretenimento", date: "2026-06-01", status: "completed" },
  { id: "6", description: "Energia elétrica", amount: 189.5, type: "expense", category: "Moradia", date: "2026-06-04", status: "pending" },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: "1", name: "Moradia", icon: "🏠", color: "#6366f1", budget: 3000, spent: 0 },
  { id: "2", name: "Alimentação", icon: "🛒", color: "#f59e0b", budget: 1200, spent: 0 },
  { id: "3", name: "Transporte", icon: "🚗", color: "#3b82f6", budget: 500, spent: 0 },
  { id: "4", name: "Saúde", icon: "💊", color: "#10b981", budget: 400, spent: 0 },
  { id: "5", name: "Entretenimento", icon: "🎬", color: "#ec4899", budget: 300, spent: 0 },
  { id: "6", name: "Investimentos", icon: "📈", color: "#8b5cf6", budget: 2000, spent: 0 },
  { id: "7", name: "Trabalho", icon: "💼", color: "#059669", budget: 0, spent: 0 },
  { id: "8", name: "Freelance", icon: "🖥️", color: "#0ea5e9", budget: 0, spent: 0 },
];

export const DEFAULT_SETTINGS: Settings = {
  notifEmail: true,
  notifBudget: true,
  currency: "BRL",
};
