import type { Account, AppNotification, BackupSnapshot, Category, DebtAllocation, MonthlyClosure, MonthlyGoal, MonthlyPoint, RecurringTransaction, Settings, Stats, Transaction, User } from "@/data/types";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export interface WorkspacePayload {
  transactions: Transaction[];
  deletedTransactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  settings: Settings;
  notifications: AppNotification[];
  monthlyGoals: MonthlyGoal[];
  monthlyClosures: MonthlyClosure[];
  recurringTransactions: RecurringTransaction[];
  backupSnapshots: BackupSnapshot[];
  debtAllocations: DebtAllocation[];
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = "Erro ao comunicar com a API.";
    try {
      const data = (await response.json()) as { message?: string };
      message = data.message ?? message;
    } catch {
      // Keep the default message when the API does not return JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, verificationToken: string) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, verificationToken }),
    }),

  requestEmailCode: (email: string, purpose: "register" | "reset") =>
    request<{ message: string }>("/auth/email-code", {
      method: "POST",
      body: JSON.stringify({ email, purpose }),
    }),

  verifyEmailCode: (email: string, code: string, purpose: "register" | "reset") =>
    request<{ verificationToken: string }>("/auth/verify-email-code", {
      method: "POST",
      body: JSON.stringify({ email, code, purpose }),
    }),

  resetPassword: (email: string, password: string, verificationToken: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, password, verificationToken }),
    }),

  me: (token: string) => request<{ user: User }>("/auth/me", {}, token),

  updateProfile: (token: string, user: Omit<User, "id" | "plan">) =>
    request<{ user: User }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(user),
    }, token),

  getWorkspace: (token: string) =>
    request<{ workspace: WorkspacePayload }>("/workspace", {}, token),

  updateWorkspace: (token: string, workspace: Partial<WorkspacePayload>) =>
    request<{ workspace: WorkspacePayload }>("/workspace", {
      method: "PATCH",
      body: JSON.stringify(workspace),
    }, token),

  getTransactions: (token: string) => request<{ transactions: Transaction[] }>("/transactions", {}, token),

  createTransaction: (token: string, transaction: Omit<Transaction, "id">) =>
    request<{ transaction: Transaction }>("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    }, token),

  deleteTransaction: (token: string, id: string) =>
    request<void>(`/transactions/${id}`, { method: "DELETE" }, token),

  clearTransactions: (token: string) =>
    request<void>("/transactions", { method: "DELETE" }, token),

  getCategories: (token: string) => request<{ categories: Category[] }>("/categories", {}, token),

  createCategory: (token: string, category: Omit<Category, "id" | "spent">) =>
    request<{ category: Category }>("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    }, token),

  updateCategory: (token: string, id: string, category: Partial<Omit<Category, "id" | "spent">>) =>
    request<{ category: Category }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    }, token),

  deleteCategory: (token: string, id: string) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }, token),

  getSettings: (token: string) => request<{ settings: Settings }>("/settings", {}, token),

  updateSettings: (token: string, settings: Partial<Settings>) =>
    request<{ settings: Settings }>("/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    }, token),

  getMonthly: (token: string, month?: string) =>
    request<{ goals: MonthlyGoal[]; closures: MonthlyClosure[] }>(`/monthly${month ? `?month=${month}` : ""}`, {}, token),

  saveMonthlyGoal: (token: string, month: string, goal: Omit<MonthlyGoal, "month" | "updatedAt">) =>
    request<{ goal: MonthlyGoal }>(`/monthly/goals/${month}`, {
      method: "PUT",
      body: JSON.stringify(goal),
    }, token),

  saveMonthlyClosure: (token: string, month: string, closure: Omit<MonthlyClosure, "month">) =>
    request<{ closure: MonthlyClosure }>(`/monthly/closures/${month}`, {
      method: "PUT",
      body: JSON.stringify(closure),
    }, token),

  deleteMonthlyClosure: (token: string, month: string) =>
    request<void>(`/monthly/closures/${month}`, { method: "DELETE" }, token),

  getRecurringTransactions: (token: string) =>
    request<{ recurringTransactions: RecurringTransaction[] }>("/recurring", {}, token),

  createRecurringTransaction: (token: string, recurringTransaction: Omit<RecurringTransaction, "id">) =>
    request<{ recurringTransaction: RecurringTransaction }>("/recurring", {
      method: "POST",
      body: JSON.stringify(recurringTransaction),
    }, token),

  updateRecurringTransaction: (token: string, id: string, recurringTransaction: Partial<Omit<RecurringTransaction, "id">>) =>
    request<{ recurringTransaction: RecurringTransaction }>(`/recurring/${id}`, {
      method: "PATCH",
      body: JSON.stringify(recurringTransaction),
    }, token),

  deleteRecurringTransaction: (token: string, id: string) =>
    request<void>(`/recurring/${id}`, { method: "DELETE" }, token),

  getSummary: (token: string) =>
    request<{
      stats: Stats;
      monthly: MonthlyPoint[];
      categories: Category[];
      recentTransactions: Transaction[];
    }>("/summary", {}, token),

  getPlans: (token: string) =>
    request<{ plans: Array<{ id: User["plan"]; name: string; price: number; features: string[] }> }>("/billing/plans", {}, token),

  updatePlan: (token: string, plan: User["plan"]) =>
    request<{ user: User }>("/billing/plan", {
      method: "PATCH",
      body: JSON.stringify({ plan }),
    }, token),
};

export function getCsvExportUrl() {
  return `${API_URL}/export/csv`;
}
