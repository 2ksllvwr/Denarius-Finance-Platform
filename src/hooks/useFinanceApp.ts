import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AppNotification,
  type Account,
  type BackupSnapshot,
  DEFAULT_SETTINGS,
  type DenariusBackup,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  type Category,
  type MonthlyClosure,
  type MonthlyGoal,
  type ProfileInput,
  type RecurringTransaction,
  type Settings,
  type Transaction,
  type TransactionStatus,
  type User,
} from "@/data/types";
import { createBackupSnapshot, downloadBackupFile, parseBackupFile } from "@/utils/backup";
import { applyCategorySpent, calculateMonthlyData, calculateStats, filterTransactionsByMonth, formatMonthLabel, getDateInMonth, getMonthKey, shiftMonth } from "@/utils/finance";
import { createSalt, hashSecret, verifySecret } from "@/utils/security";
import {
  authenticateLocalAccount,
  createLocalAccount,
  readActiveLocalUser,
  updateLocalAccountUser,
  writeActiveLocalUser,
} from "@/utils/localAuth";
import { readLocalStorage, writeLocalStorage } from "@/utils/localStore";

type Mode = "api" | "local";
type WorkspaceResource = "transactions" | "deletedTransactions" | "categories" | "accounts" | "settings" | "notifications" | "monthlyGoals" | "monthlyClosures" | "recurringTransactions" | "backupSnapshots";

const TOKEN_KEY = "fluxo.token";
const MODE_KEY = "fluxo.mode";

const workspaceKey = (userId: string, resource: WorkspaceResource) => `fluxo.local.users.${userId}.${resource}`;

interface WorkspaceData {
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
}

export interface TransactionInput {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  subcategory?: string;
  tags?: string[];
  accountId?: string;
  date: string;
  status: TransactionStatus;
}

export interface InstallmentTransactionInput extends TransactionInput {
  installments: number;
}

export interface AccountInput {
  name: string;
  type: Account["type"];
  balance: number;
  color: string;
  closingDay?: number;
  dueDay?: number;
  creditLimit?: number;
}

export interface MonthlyGoalInput {
  month: string;
  savingsTarget: number;
  spendingLimit: number;
  notes: string;
}

export interface RecurringTransactionInput {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  dayOfMonth: number;
  status: TransactionStatus;
  active: boolean;
}

export interface OnboardingInput {
  currency: Settings["currency"];
  savingsTarget: number;
  spendingLimit: number;
  notes: string;
}

const createInitialCategories = () => INITIAL_CATEGORIES.map(category => ({ ...category, spent: 0 }));
const createInitialAccounts = () => INITIAL_ACCOUNTS.map(account => ({ ...account }));

const normalizeSettings = (settings: Partial<Settings> | undefined): Settings => ({
  ...DEFAULT_SETTINGS,
  ...settings,
  autoLockMinutes: settings?.autoLockMinutes ?? DEFAULT_SETTINGS.autoLockMinutes,
  onboardingCompleted: settings?.onboardingCompleted ?? DEFAULT_SETTINGS.onboardingCompleted,
});

function ensureCategoryList(categories: Category[], categoryNames: string[]) {
  const existing = new Set(categories.map(category => category.name));
  const additions = categoryNames
    .filter(name => name.trim().length > 0 && !existing.has(name))
    .map(name => {
      existing.add(name);
      return { id: crypto.randomUUID(), name, icon: "ðŸ“Œ", color: "#6366f1", budget: 0, spent: 0 };
    });

  return additions.length > 0 ? [...categories, ...additions] : categories;
}

function shiftDateByMonths(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year || new Date().getFullYear(), (month || 1) - 1 + offset, 1);
  return getDateInMonth(getMonthKey(target), day || 1);
}

function readWorkspace(user: User | null): WorkspaceData {
  if (!user) {
    return {
      transactions: [],
      deletedTransactions: [],
      categories: createInitialCategories(),
      accounts: createInitialAccounts(),
      settings: { ...DEFAULT_SETTINGS },
      notifications: [],
      monthlyGoals: [],
      monthlyClosures: [],
      recurringTransactions: [],
      backupSnapshots: [],
    };
  }

  const transactions = readLocalStorage<Transaction[]>(workspaceKey(user.id, "transactions"), []);
  const deletedTransactions = readLocalStorage<Transaction[]>(workspaceKey(user.id, "deletedTransactions"), []);
  const categories = readLocalStorage<Category[]>(workspaceKey(user.id, "categories"), createInitialCategories());
  const accounts = readLocalStorage<Account[]>(workspaceKey(user.id, "accounts"), createInitialAccounts());
  const settings = normalizeSettings(readLocalStorage<Partial<Settings>>(workspaceKey(user.id, "settings"), DEFAULT_SETTINGS));

  return {
    transactions,
    deletedTransactions,
    categories: applyCategorySpent(categories, transactions),
    accounts,
    settings,
    notifications: readLocalStorage<AppNotification[]>(workspaceKey(user.id, "notifications"), []),
    monthlyGoals: readLocalStorage<MonthlyGoal[]>(workspaceKey(user.id, "monthlyGoals"), []),
    monthlyClosures: readLocalStorage<MonthlyClosure[]>(workspaceKey(user.id, "monthlyClosures"), []),
    recurringTransactions: readLocalStorage<RecurringTransaction[]>(workspaceKey(user.id, "recurringTransactions"), []),
    backupSnapshots: readLocalStorage<BackupSnapshot[]>(workspaceKey(user.id, "backupSnapshots"), []),
  };
}

function writeWorkspace(user: User, workspace: Partial<WorkspaceData>) {
  if (workspace.transactions !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "transactions"), workspace.transactions);
  }

  if (workspace.deletedTransactions !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "deletedTransactions"), workspace.deletedTransactions);
  }

  if (workspace.categories !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "categories"), workspace.categories);
  }

  if (workspace.accounts !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "accounts"), workspace.accounts);
  }

  if (workspace.settings !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "settings"), workspace.settings);
  }

  if (workspace.notifications !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "notifications"), workspace.notifications);
  }

  if (workspace.monthlyGoals !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "monthlyGoals"), workspace.monthlyGoals);
  }

  if (workspace.monthlyClosures !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "monthlyClosures"), workspace.monthlyClosures);
  }

  if (workspace.recurringTransactions !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "recurringTransactions"), workspace.recurringTransactions);
  }

  if (workspace.backupSnapshots !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "backupSnapshots"), workspace.backupSnapshots);
  }
}

export function useFinanceApp() {
  const activeUser = readActiveLocalUser();
  const activeWorkspace = readWorkspace(activeUser);

  const [mode] = useState<Mode>("local");
  const [token] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(activeUser);
  const [transactions, setTransactions] = useState<Transaction[]>(activeWorkspace.transactions);
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>(activeWorkspace.deletedTransactions);
  const [categories, setCategories] = useState<Category[]>(activeWorkspace.categories);
  const [accounts, setAccounts] = useState<Account[]>(activeWorkspace.accounts);
  const [settings, setSettings] = useState<Settings>(activeWorkspace.settings);
  const [notifications, setNotifications] = useState<AppNotification[]>(activeWorkspace.notifications);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(activeWorkspace.monthlyGoals);
  const [monthlyClosures, setMonthlyClosures] = useState<MonthlyClosure[]>(activeWorkspace.monthlyClosures);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(activeWorkspace.recurringTransactions);
  const [backupSnapshots, setBackupSnapshots] = useState<BackupSnapshot[]>(activeWorkspace.backupSnapshots);
  const [locked, setLocked] = useState(() => Boolean(activeWorkspace.settings.pinHash));
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistWorkspace = useCallback((workspace: Partial<WorkspaceData>, targetUser = user) => {
    if (!targetUser) return;
    writeWorkspace(targetUser, workspace);
  }, [user]);

  const loadWorkspace = useCallback((nextUser: User) => {
    const nextWorkspace = readWorkspace(nextUser);
    setTransactions(nextWorkspace.transactions);
    setDeletedTransactions(nextWorkspace.deletedTransactions);
    setCategories(nextWorkspace.categories);
    setAccounts(nextWorkspace.accounts);
    setSettings(nextWorkspace.settings);
    setNotifications(nextWorkspace.notifications);
    setMonthlyGoals(nextWorkspace.monthlyGoals);
    setMonthlyClosures(nextWorkspace.monthlyClosures);
    setRecurringTransactions(nextWorkspace.recurringTransactions);
    setBackupSnapshots(nextWorkspace.backupSnapshots);
    setLocked(Boolean(nextWorkspace.settings.pinHash));
  }, []);

  const pushNotification = useCallback((input: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const targetUser = user;
    if (!targetUser) return;

    const notification: AppNotification = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false,
      ...input,
    };

    setNotifications(prev => {
      const nextNotifications = [notification, ...prev].slice(0, 30);
      writeWorkspace(targetUser, { notifications: nextNotifications });
      return nextNotifications;
    });

    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      new Notification(input.title, { body: input.message });
    }
  }, [user]);

  const markNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const nextNotifications = prev.map(notification => ({ ...notification, read: true }));
      if (user) writeWorkspace(user, { notifications: nextNotifications });
      return nextNotifications;
    });
  }, [user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    if (user) writeWorkspace(user, { notifications: [] });
  }, [user]);

  const monthTransactions = useMemo(() => filterTransactionsByMonth(transactions, selectedMonth), [selectedMonth, transactions]);
  const stats = useMemo(() => calculateStats(monthTransactions), [monthTransactions]);
  const categoriesWithSpent = useMemo(() => applyCategorySpent(categories, monthTransactions), [categories, monthTransactions]);
  const monthly = useMemo(() => calculateMonthlyData(transactions), [transactions]);
  const selectedMonthLabel = useMemo(() => formatMonthLabel(selectedMonth), [selectedMonth]);
  const selectedMonthlyGoal = useMemo(() => monthlyGoals.find(goal => goal.month === selectedMonth) ?? null, [monthlyGoals, selectedMonth]);
  const selectedMonthlyClosure = useMemo(() => monthlyClosures.find(closure => closure.month === selectedMonth) ?? null, [monthlyClosures, selectedMonth]);
  const goToPreviousMonth = useCallback(() => setSelectedMonth(prev => shiftMonth(prev, -1)), []);
  const goToNextMonth = useCallback(() => setSelectedMonth(prev => shiftMonth(prev, 1)), []);

  const buildBackup = useCallback((overrides: Partial<WorkspaceData> = {}, targetUser = user): DenariusBackup | null => {
    if (!targetUser) return null;

    return {
      app: "Denarius",
      version: 1,
      exportedAt: new Date().toISOString(),
      user: targetUser,
      transactions: overrides.transactions ?? transactions,
      deletedTransactions: overrides.deletedTransactions ?? deletedTransactions,
      categories: overrides.categories ?? categories,
      accounts: overrides.accounts ?? accounts,
      settings: overrides.settings ?? settings,
      monthlyGoals: overrides.monthlyGoals ?? monthlyGoals,
      monthlyClosures: overrides.monthlyClosures ?? monthlyClosures,
      recurringTransactions: overrides.recurringTransactions ?? recurringTransactions,
    };
  }, [accounts, categories, deletedTransactions, monthlyClosures, monthlyGoals, recurringTransactions, settings, transactions, user]);

  const saveBackupSnapshot = useCallback((reason: BackupSnapshot["reason"], overrides: Partial<WorkspaceData> = {}, targetUser = user) => {
    const backup = buildBackup(overrides, targetUser);
    if (!backup || !targetUser) return;

    const snapshot = createBackupSnapshot(backup, reason);
    setBackupSnapshots(prev => {
      const nextSnapshots = [snapshot, ...prev].slice(0, 5);
      writeWorkspace(targetUser, { backupSnapshots: nextSnapshots });
      return nextSnapshots;
    });
  }, [buildBackup, user]);

  useEffect(() => {
    if (!user || !settings.pinHash || locked) return;

    let timeout = window.setTimeout(() => setLocked(true), Math.max(settings.autoLockMinutes, 1) * 60 * 1000);
    const reset = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setLocked(true), Math.max(settings.autoLockMinutes, 1) * 60 * 1000);
    };

    window.addEventListener("pointerdown", reset);
    window.addEventListener("keydown", reset);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [locked, settings.autoLockMinutes, settings.pinHash, user]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const nextUser = await authenticateLocalAccount(email, password);
      localStorage.removeItem(TOKEN_KEY);
      writeLocalStorage(MODE_KEY, "local");
      writeActiveLocalUser(nextUser);
      setUser(nextUser);
      loadWorkspace(nextUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao fazer login.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWorkspace]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const nextUser = await createLocalAccount({ name, email, password });
      const nextWorkspace = {
        transactions: [],
        deletedTransactions: [],
        categories: createInitialCategories(),
        accounts: createInitialAccounts(),
        settings: { ...DEFAULT_SETTINGS },
        notifications: [{
          id: crypto.randomUUID(),
          title: "Conta criada",
          message: "Seu perfil offline estÃ¡ pronto para uso.",
          kind: "success" as const,
          createdAt: new Date().toISOString(),
          read: false,
        }],
        monthlyGoals: [],
        monthlyClosures: [],
        recurringTransactions: [],
        backupSnapshots: [],
      };

      localStorage.removeItem(TOKEN_KEY);
      writeLocalStorage(MODE_KEY, "local");
      writeActiveLocalUser(nextUser);
      writeWorkspace(nextUser, nextWorkspace);
      setUser(nextUser);
      setTransactions(nextWorkspace.transactions);
      setDeletedTransactions(nextWorkspace.deletedTransactions);
      setCategories(nextWorkspace.categories);
      setAccounts(nextWorkspace.accounts);
      setSettings(nextWorkspace.settings);
      setNotifications(nextWorkspace.notifications);
      setMonthlyGoals(nextWorkspace.monthlyGoals);
      setMonthlyClosures(nextWorkspace.monthlyClosures);
      setRecurringTransactions(nextWorkspace.recurringTransactions);
      setBackupSnapshots(nextWorkspace.backupSnapshots);
      setLocked(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar conta.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (user) {
      persistWorkspace({ transactions, deletedTransactions, categories, accounts, settings, notifications, monthlyGoals, monthlyClosures, recurringTransactions, backupSnapshots }, user);
    }

    localStorage.removeItem(TOKEN_KEY);
    writeLocalStorage(MODE_KEY, "local");
    writeActiveLocalUser(null);
    setUser(null);
  }, [accounts, backupSnapshots, categories, deletedTransactions, monthlyClosures, monthlyGoals, notifications, persistWorkspace, recurringTransactions, settings, transactions, user]);

  const addTransaction = useCallback(async (input: TransactionInput) => {
    const transactionMonth = input.date.slice(0, 7);
    const previousMonthCategories = applyCategorySpent(categories, filterTransactionsByMonth(transactions, transactionMonth));
    const previousSpent = new Map(previousMonthCategories.map(category => [category.name, category.spent]));
    const localTransaction: Transaction = { id: crypto.randomUUID(), ...input };
    const nextTransactions = [localTransaction, ...transactions];
    const categoryExists = categories.some(category => category.name === input.category);
    const nextCategories = categoryExists
      ? categories
      : [...categories, { id: crypto.randomUUID(), name: input.category, icon: "ðŸ“Œ", color: "#6366f1", budget: 0, spent: 0 }];
    const nextCategoriesWithSpent = applyCategorySpent(nextCategories, nextTransactions);

    setTransactions(nextTransactions);
    setCategories(nextCategoriesWithSpent);
    persistWorkspace({ transactions: nextTransactions, categories: nextCategoriesWithSpent });

    pushNotification({
      title: input.type === "income" ? "Receita registrada" : "Despesa registrada",
      message: `${input.description} foi adicionada em ${input.category}.`,
      kind: input.type === "income" ? "success" : "info",
    });

    if (settings.notifBudget && input.type === "expense") {
      applyCategorySpent(nextCategories, filterTransactionsByMonth(nextTransactions, transactionMonth))
        .filter(category => category.budget > 0)
        .forEach(category => {
          const previousPct = ((previousSpent.get(category.name) ?? 0) / category.budget) * 100;
          const nextPct = (category.spent / category.budget) * 100;

          if (previousPct < 80 && nextPct >= 80) {
            pushNotification({
              title: nextPct >= 100 ? "OrÃ§amento estourado" : "OrÃ§amento em atenÃ§Ã£o",
              message: `${category.name} chegou a ${Math.round(nextPct)}% do orÃ§amento.`,
              kind: "warning",
            });
          }
        });
    }
  }, [categories, persistWorkspace, pushNotification, settings.notifBudget, transactions]);

  const addInstallmentTransaction = useCallback(async (input: InstallmentTransactionInput) => {
    const installments = Math.max(1, Math.min(Math.round(input.installments), 60));
    if (installments <= 1) {
      await addTransaction(input);
      return;
    }

    const baseAmount = Math.floor((input.amount / installments) * 100) / 100;
    const generatedTransactions: Transaction[] = Array.from({ length: installments }, (_, index) => {
      const amount = index === installments - 1
        ? Math.round((input.amount - baseAmount * (installments - 1)) * 100) / 100
        : baseAmount;

      return {
        id: crypto.randomUUID(),
        description: `${input.description.trim()} (${index + 1}/${installments})`,
        amount,
        type: input.type,
        category: input.category,
        subcategory: input.subcategory,
        tags: input.tags,
        accountId: input.accountId,
        date: shiftDateByMonths(input.date, index),
        status: input.status,
      };
    });
    const nextTransactions = [...generatedTransactions, ...transactions];
    const nextCategories = applyCategorySpent(ensureCategoryList(categories, [input.category]), nextTransactions);

    setTransactions(nextTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, categories: nextCategories });
    saveBackupSnapshot("auto", { transactions: nextTransactions, categories: nextCategories });
    pushNotification({
      title: "Parcelamento criado",
      message: `${installments} parcelas de ${input.description.trim()} foram adicionadas.`,
      kind: input.type === "income" ? "success" : "info",
    });
  }, [addTransaction, categories, persistWorkspace, pushNotification, saveBackupSnapshot, transactions]);

  const importTransactions = useCallback(async (inputs: TransactionInput[]) => {
    const validInputs = inputs.filter(input => (
      input.description.trim().length > 0 &&
      Number.isFinite(input.amount) &&
      input.amount > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(input.date)
    ));

    if (validInputs.length === 0) {
      pushNotification({ title: "ImportaÃ§Ã£o vazia", message: "Nenhuma linha vÃ¡lida foi encontrada no arquivo.", kind: "warning" });
      return;
    }

    const defaultAccountId = accounts.find(account => account.type !== "credit")?.id ?? accounts[0]?.id;
    const importedTransactions: Transaction[] = validInputs.map(input => ({
      id: crypto.randomUUID(),
      description: input.description.trim(),
      amount: input.amount,
      type: input.type,
      category: input.category.trim(),
      subcategory: input.subcategory?.trim() || undefined,
      tags: input.tags?.map(tag => tag.trim()).filter(Boolean),
      accountId: input.accountId ?? defaultAccountId,
      date: input.date,
      status: input.status,
    }));
    const nextTransactions = [...importedTransactions, ...transactions];
    const nextCategories = applyCategorySpent(ensureCategoryList(categories, importedTransactions.map(item => item.category)), nextTransactions);

    setTransactions(nextTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, categories: nextCategories });
    pushNotification({
      title: "ImportaÃ§Ã£o concluÃ­da",
      message: `${importedTransactions.length} transaÃ§Ãµes foram adicionadas ao Denarius.`,
      kind: "success",
    });
  }, [accounts, categories, persistWorkspace, pushNotification, transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const deletedTransaction = transactions.find(transaction => transaction.id === id);
    if (!deletedTransaction) return;

    const nextTransactions = transactions.filter(transaction => transaction.id !== id);
    const nextDeletedTransactions = [deletedTransaction, ...deletedTransactions];
    const nextCategories = applyCategorySpent(categories, nextTransactions);

    setTransactions(nextTransactions);
    setDeletedTransactions(nextDeletedTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, deletedTransactions: nextDeletedTransactions, categories: nextCategories });
    pushNotification({ title: "Transacao movida para lixeira", message: "Voce pode restaurar em Ajustes > Dados.", kind: "info" });
  }, [categories, deletedTransactions, persistWorkspace, pushNotification, transactions]);

  const restoreTransaction = useCallback(async (id: string) => {
    const restoredTransaction = deletedTransactions.find(transaction => transaction.id === id);
    if (!restoredTransaction) return;

    const nextDeletedTransactions = deletedTransactions.filter(transaction => transaction.id !== id);
    const nextTransactions = [restoredTransaction, ...transactions];
    const nextCategories = applyCategorySpent(categories, nextTransactions);

    setDeletedTransactions(nextDeletedTransactions);
    setTransactions(nextTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, deletedTransactions: nextDeletedTransactions, categories: nextCategories });
    pushNotification({ title: "Transacao restaurada", message: "O lancamento voltou para sua lista.", kind: "success" });
  }, [categories, deletedTransactions, persistWorkspace, pushNotification, transactions]);

  const deleteTransactionForever = useCallback(async (id: string) => {
    const nextDeletedTransactions = deletedTransactions.filter(transaction => transaction.id !== id);

    setDeletedTransactions(nextDeletedTransactions);
    persistWorkspace({ deletedTransactions: nextDeletedTransactions });
    pushNotification({ title: "Transacao apagada", message: "O item foi removido definitivamente.", kind: "warning" });
  }, [deletedTransactions, persistWorkspace, pushNotification]);

  const emptyTrash = useCallback(async () => {
    setDeletedTransactions([]);
    persistWorkspace({ deletedTransactions: [] });
    pushNotification({ title: "Lixeira esvaziada", message: "Todos os itens da lixeira foram removidos.", kind: "warning" });
  }, [persistWorkspace, pushNotification]);

  const updateTransaction = useCallback(async (id: string, input: TransactionInput) => {
    const nextTransactions = transactions.map(transaction => transaction.id === id ? { ...transaction, ...input } : transaction);
    const nextCategories = applyCategorySpent(ensureCategoryList(categories, [input.category]), nextTransactions);

    setTransactions(nextTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, categories: nextCategories });
    saveBackupSnapshot("auto", { transactions: nextTransactions, categories: nextCategories });
    pushNotification({ title: "TransaÃ§Ã£o atualizada", message: `${input.description} foi salvo.`, kind: "success" });
  }, [categories, persistWorkspace, pushNotification, saveBackupSnapshot, transactions]);

  const duplicateTransaction = useCallback(async (id: string) => {
    const transaction = transactions.find(item => item.id === id);
    if (!transaction) return;

    const duplicated: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      description: `${transaction.description} (cÃ³pia)`,
      recurringId: undefined,
      recurringMonth: undefined,
    };
    const nextTransactions = [duplicated, ...transactions];
    const nextCategories = applyCategorySpent(categories, nextTransactions);

    setTransactions(nextTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, categories: nextCategories });
    saveBackupSnapshot("auto", { transactions: nextTransactions, categories: nextCategories });
    pushNotification({ title: "TransaÃ§Ã£o duplicada", message: `${transaction.description} foi copiada.`, kind: "success" });
  }, [categories, persistWorkspace, pushNotification, saveBackupSnapshot, transactions]);

  const toggleTransactionStatus = useCallback(async (id: string) => {
    const nextTransactions = transactions.map(transaction => transaction.id === id
      ? { ...transaction, status: transaction.status === "completed" ? "pending" as const : "completed" as const }
      : transaction);

    setTransactions(nextTransactions);
    persistWorkspace({ transactions: nextTransactions });
    saveBackupSnapshot("auto", { transactions: nextTransactions });
  }, [persistWorkspace, saveBackupSnapshot, transactions]);

  const clearTransactions = useCallback(async () => {
    const nextCategories = applyCategorySpent(categories, []);
    const nextDeletedTransactions = [...transactions, ...deletedTransactions];

    setTransactions([]);
    setDeletedTransactions(nextDeletedTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: [], deletedTransactions: nextDeletedTransactions, categories: nextCategories });
    pushNotification({ title: "Dados movidos para lixeira", message: "As transacoes podem ser restauradas em Ajustes > Dados.", kind: "warning" });
  }, [categories, deletedTransactions, persistWorkspace, pushNotification, transactions]);

  const exportBackup = useCallback(async () => {
    if (!user) return;

    const exportedAt = new Date().toISOString();
    const nextSettings = { ...settings, lastBackupAt: exportedAt };
    const backup = buildBackup({ settings: nextSettings }, user);
    if (!backup) return;

    setSettings(nextSettings);
    persistWorkspace({ settings: nextSettings });
    saveBackupSnapshot("manual", { settings: nextSettings }, user);
    downloadBackupFile(backup);
    pushNotification({ title: "Backup exportado", message: "Um arquivo JSON completo foi gerado.", kind: "success" });
  }, [buildBackup, persistWorkspace, pushNotification, saveBackupSnapshot, settings, user]);

  const importBackup = useCallback(async (file: File) => {
    if (!user) return;

    const backup = parseBackupFile(await file.text());
    const importedUser = updateLocalAccountUser({
      ...user,
      name: backup.user.name,
      email: backup.user.email,
      avatarUrl: backup.user.avatarUrl,
      title: backup.user.title,
      phone: backup.user.phone,
      bio: backup.user.bio,
      plan: backup.user.plan,
    });
    const nextSettings = normalizeSettings({
      ...backup.settings,
      lastBackupAt: new Date().toISOString(),
    });
    const nextCategories = applyCategorySpent(backup.categories, backup.transactions);
    const nextAccounts = backup.accounts ?? createInitialAccounts();
    const nextDeletedTransactions = backup.deletedTransactions ?? [];

    setUser(importedUser);
    setTransactions(backup.transactions);
    setDeletedTransactions(nextDeletedTransactions);
    setCategories(nextCategories);
    setAccounts(nextAccounts);
    setSettings(nextSettings);
    setMonthlyGoals(backup.monthlyGoals);
    setMonthlyClosures(backup.monthlyClosures);
    setRecurringTransactions(backup.recurringTransactions);
    writeWorkspace(importedUser, {
      transactions: backup.transactions,
      deletedTransactions: nextDeletedTransactions,
      categories: nextCategories,
      accounts: nextAccounts,
      settings: nextSettings,
      monthlyGoals: backup.monthlyGoals,
      monthlyClosures: backup.monthlyClosures,
      recurringTransactions: backup.recurringTransactions,
    });
    saveBackupSnapshot("import", {
      transactions: backup.transactions,
      deletedTransactions: nextDeletedTransactions,
      categories: nextCategories,
      accounts: nextAccounts,
      settings: nextSettings,
      monthlyGoals: backup.monthlyGoals,
      monthlyClosures: backup.monthlyClosures,
      recurringTransactions: backup.recurringTransactions,
    }, importedUser);
    pushNotification({ title: "Backup restaurado", message: "Seus dados foram restaurados neste perfil.", kind: "success" });
  }, [pushNotification, saveBackupSnapshot, user]);

  const createManualSnapshot = useCallback(async () => {
    const lastAutoBackupAt = new Date().toISOString();
    const nextSettings = { ...settings, lastAutoBackupAt };

    setSettings(nextSettings);
    persistWorkspace({ settings: nextSettings });
    saveBackupSnapshot("manual", { settings: nextSettings });
    pushNotification({ title: "Snapshot criado", message: "Uma cÃ³pia local foi salva neste navegador.", kind: "success" });
  }, [persistWorkspace, pushNotification, saveBackupSnapshot, settings]);

  const restoreSnapshot = useCallback(async (id: string) => {
    const snapshot = backupSnapshots.find(item => item.id === id);
    if (!snapshot || !user) return;

    const backup = snapshot.payload;
    const nextSettings = normalizeSettings({
      ...backup.settings,
      lastBackupAt: new Date().toISOString(),
    });
    const nextCategories = applyCategorySpent(backup.categories, backup.transactions);
    const nextAccounts = backup.accounts ?? createInitialAccounts();
    const nextDeletedTransactions = backup.deletedTransactions ?? [];

    setTransactions(backup.transactions);
    setDeletedTransactions(nextDeletedTransactions);
    setCategories(nextCategories);
    setAccounts(nextAccounts);
    setSettings(nextSettings);
    setMonthlyGoals(backup.monthlyGoals);
    setMonthlyClosures(backup.monthlyClosures);
    setRecurringTransactions(backup.recurringTransactions);
    writeWorkspace(user, {
      transactions: backup.transactions,
      deletedTransactions: nextDeletedTransactions,
      categories: nextCategories,
      accounts: nextAccounts,
      settings: nextSettings,
      monthlyGoals: backup.monthlyGoals,
      monthlyClosures: backup.monthlyClosures,
      recurringTransactions: backup.recurringTransactions,
    });
    pushNotification({ title: "Snapshot restaurado", message: "Os dados locais voltaram para a versÃ£o escolhida.", kind: "success" });
  }, [backupSnapshots, pushNotification, user]);

  const setSecurityPin = useCallback(async (pin: string) => {
    if (!/^\d{4,8}$/.test(pin)) {
      throw new Error("O PIN precisa ter entre 4 e 8 nÃºmeros.");
    }

    const pinSalt = createSalt();
    const pinHash = await hashSecret(pin, pinSalt);
    const nextSettings = { ...settings, pinSalt, pinHash };

    setSettings(nextSettings);
    setLocked(false);
    persistWorkspace({ settings: nextSettings });
    pushNotification({ title: "PIN ativado", message: "O bloqueio local jÃ¡ estÃ¡ protegendo sua sessÃ£o.", kind: "success" });
  }, [persistWorkspace, pushNotification, settings]);

  const clearSecurityPin = useCallback(async () => {
    const nextSettings = { ...settings, pinHash: undefined, pinSalt: undefined };

    setSettings(nextSettings);
    setLocked(false);
    persistWorkspace({ settings: nextSettings });
    pushNotification({ title: "PIN removido", message: "O bloqueio local foi desativado.", kind: "info" });
  }, [persistWorkspace, pushNotification, settings]);

  const unlockWithPin = useCallback(async (pin: string) => {
    if (!settings.pinHash || !settings.pinSalt) {
      setLocked(false);
      return true;
    }

    const valid = await verifySecret(pin, settings.pinSalt, settings.pinHash);
    if (valid) setLocked(false);
    return valid;
  }, [settings.pinHash, settings.pinSalt]);

  const lockApp = useCallback(() => {
    if (settings.pinHash) setLocked(true);
  }, [settings.pinHash]);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    const nextSettings = {
      ...settings,
      currency: input.currency,
      onboardingCompleted: true,
    };
    const goal: MonthlyGoal = {
      month: selectedMonth,
      savingsTarget: Math.max(0, input.savingsTarget),
      spendingLimit: Math.max(0, input.spendingLimit),
      notes: input.notes.trim(),
      updatedAt: new Date().toISOString(),
    };
    const nextGoals = monthlyGoals.some(item => item.month === selectedMonth)
      ? monthlyGoals.map(item => item.month === selectedMonth ? goal : item)
      : [goal, ...monthlyGoals];

    setSettings(nextSettings);
    setMonthlyGoals(nextGoals);
    persistWorkspace({ settings: nextSettings, monthlyGoals: nextGoals });
    saveBackupSnapshot("auto", { settings: nextSettings, monthlyGoals: nextGoals });
    pushNotification({ title: "Primeira configuraÃ§Ã£o concluÃ­da", message: "Seu Denarius jÃ¡ estÃ¡ ajustado para o mÃªs.", kind: "success" });
  }, [monthlyGoals, persistWorkspace, pushNotification, saveBackupSnapshot, selectedMonth, settings]);

  const saveMonthlyGoal = useCallback(async (input: MonthlyGoalInput) => {
    const goal: MonthlyGoal = {
      ...input,
      savingsTarget: Math.max(0, input.savingsTarget),
      spendingLimit: Math.max(0, input.spendingLimit),
      notes: input.notes.trim(),
      updatedAt: new Date().toISOString(),
    };
    const nextGoals = monthlyGoals.some(item => item.month === goal.month)
      ? monthlyGoals.map(item => item.month === goal.month ? goal : item)
      : [goal, ...monthlyGoals];

    setMonthlyGoals(nextGoals);
    persistWorkspace({ monthlyGoals: nextGoals });
    pushNotification({ title: "Meta mensal salva", message: `Planejamento de ${formatMonthLabel(goal.month)} atualizado.`, kind: "success" });
  }, [monthlyGoals, persistWorkspace, pushNotification]);

  const closeSelectedMonth = useCallback(async (notes = "") => {
    const closure: MonthlyClosure = {
      month: selectedMonth,
      closedAt: new Date().toISOString(),
      income: stats.income,
      expense: stats.expense,
      balance: stats.balance,
      pending: stats.pending,
      transactionCount: stats.count,
      notes: notes.trim(),
    };
    const nextClosures = monthlyClosures.some(item => item.month === selectedMonth)
      ? monthlyClosures.map(item => item.month === selectedMonth ? closure : item)
      : [closure, ...monthlyClosures];

    setMonthlyClosures(nextClosures);
    persistWorkspace({ monthlyClosures: nextClosures });
    pushNotification({ title: "MÃªs fechado", message: `${selectedMonthLabel} foi salvo como fechamento mensal.`, kind: "success" });
  }, [monthlyClosures, persistWorkspace, pushNotification, selectedMonth, selectedMonthLabel, stats.balance, stats.count, stats.expense, stats.income, stats.pending]);

  const reopenSelectedMonth = useCallback(async () => {
    const nextClosures = monthlyClosures.filter(item => item.month !== selectedMonth);

    setMonthlyClosures(nextClosures);
    persistWorkspace({ monthlyClosures: nextClosures });
    pushNotification({ title: "MÃªs reaberto", message: `${selectedMonthLabel} voltou para ediÃ§Ã£o normal.`, kind: "info" });
  }, [monthlyClosures, persistWorkspace, pushNotification, selectedMonth, selectedMonthLabel]);

  const addRecurringTransaction = useCallback(async (input: RecurringTransactionInput) => {
    const recurring: RecurringTransaction = {
      id: crypto.randomUUID(),
      description: input.description.trim(),
      amount: Math.max(0, input.amount),
      type: input.type,
      category: input.category.trim(),
      dayOfMonth: Math.min(Math.max(Math.round(input.dayOfMonth), 1), 31),
      status: input.status,
      active: input.active,
    };
    const nextRecurring = [recurring, ...recurringTransactions];
    const nextCategories = ensureCategoryList(categories, [recurring.category]);

    setRecurringTransactions(nextRecurring);
    setCategories(nextCategories);
    persistWorkspace({ recurringTransactions: nextRecurring, categories: nextCategories });
    pushNotification({ title: "RecorrÃªncia criada", message: `${recurring.description} jÃ¡ pode ser gerada mensalmente.`, kind: "success" });
  }, [categories, persistWorkspace, pushNotification, recurringTransactions]);

  const toggleRecurringTransaction = useCallback(async (id: string) => {
    const nextRecurring = recurringTransactions.map(item => item.id === id ? { ...item, active: !item.active } : item);

    setRecurringTransactions(nextRecurring);
    persistWorkspace({ recurringTransactions: nextRecurring });
  }, [persistWorkspace, recurringTransactions]);

  const deleteRecurringTransaction = useCallback(async (id: string) => {
    const nextRecurring = recurringTransactions.filter(item => item.id !== id);

    setRecurringTransactions(nextRecurring);
    persistWorkspace({ recurringTransactions: nextRecurring });
    pushNotification({ title: "RecorrÃªncia removida", message: "A regra mensal saiu da sua lista.", kind: "info" });
  }, [persistWorkspace, pushNotification, recurringTransactions]);

  const generateRecurringForSelectedMonth = useCallback(async () => {
    const activeRecurring = recurringTransactions.filter(item => (
      item.active &&
      !transactions.some(transaction => transaction.recurringId === item.id && transaction.recurringMonth === selectedMonth)
    ));

    if (activeRecurring.length === 0) {
      pushNotification({ title: "Nada para gerar", message: "Todas as recorrÃªncias ativas jÃ¡ existem neste mÃªs.", kind: "info" });
      return;
    }

    const generatedTransactions: Transaction[] = activeRecurring.map(item => ({
      id: crypto.randomUUID(),
      description: item.description,
      amount: item.amount,
      type: item.type,
      category: item.category,
      accountId: undefined,
      date: getDateInMonth(selectedMonth, item.dayOfMonth),
      status: item.status,
      recurringId: item.id,
      recurringMonth: selectedMonth,
    }));
    const nextTransactions = [...generatedTransactions, ...transactions];
    const nextRecurring = recurringTransactions.map(item => activeRecurring.some(active => active.id === item.id) ? { ...item, lastGeneratedMonth: selectedMonth } : item);
    const nextCategories = applyCategorySpent(ensureCategoryList(categories, generatedTransactions.map(item => item.category)), nextTransactions);

    setTransactions(nextTransactions);
    setRecurringTransactions(nextRecurring);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, recurringTransactions: nextRecurring, categories: nextCategories });
    pushNotification({
      title: "RecorrÃªncias geradas",
      message: `${generatedTransactions.length} lanÃ§amentos foram criados em ${selectedMonthLabel}.`,
      kind: "success",
    });
  }, [categories, persistWorkspace, pushNotification, recurringTransactions, selectedMonth, selectedMonthLabel, transactions]);

  const saveSettings = useCallback(async (nextSettings: Settings) => {
    const normalizedSettings = normalizeSettings(nextSettings);

    setSettings(normalizedSettings);
    persistWorkspace({ settings: normalizedSettings });
    saveBackupSnapshot("auto", { settings: normalizedSettings });
    pushNotification({ title: "PreferÃªncias salvas", message: "Suas configuraÃ§Ãµes foram atualizadas.", kind: "success" });
  }, [persistWorkspace, pushNotification, saveBackupSnapshot]);

  const updateProfile = useCallback(async (profile: ProfileInput) => {
    if (!user) return;

    const nextUser = updateLocalAccountUser({
      ...user,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      title: profile.title,
      phone: profile.phone,
      bio: profile.bio,
    });

    setUser(nextUser);
    pushNotification({ title: "Perfil atualizado", message: "Sua foto e dados pessoais foram salvos.", kind: "success" });
  }, [pushNotification, user]);

  const addCategory = useCallback(async (category: Omit<Category, "id" | "spent">) => {
    const nextCategories = [...categories, { id: crypto.randomUUID(), spent: 0, ...category }];

    setCategories(nextCategories);
    persistWorkspace({ categories: nextCategories });
    pushNotification({ title: "Categoria criada", message: `${category.name} jÃ¡ estÃ¡ disponÃ­vel para lanÃ§amentos.`, kind: "success" });
  }, [categories, persistWorkspace, pushNotification]);

  const updateCategory = useCallback(async (id: string, category: Partial<Omit<Category, "id" | "spent">>) => {
    const nextCategories = categories.map(item => item.id === id ? { ...item, ...category } : item);

    setCategories(nextCategories);
    persistWorkspace({ categories: nextCategories });
    pushNotification({ title: "Categoria atualizada", message: "As mudanÃ§as jÃ¡ foram salvas.", kind: "success" });
  }, [categories, persistWorkspace, pushNotification]);

  const deleteCategory = useCallback(async (id: string) => {
    const nextCategories = categories.filter(category => category.id !== id);

    setCategories(nextCategories);
    persistWorkspace({ categories: nextCategories });
    pushNotification({ title: "Categoria removida", message: "A categoria saiu da sua lista.", kind: "info" });
  }, [categories, persistWorkspace, pushNotification]);

  const addAccount = useCallback(async (input: AccountInput) => {
    const nextAccounts = [{ id: crypto.randomUUID(), ...input }, ...accounts];

    setAccounts(nextAccounts);
    persistWorkspace({ accounts: nextAccounts });
    saveBackupSnapshot("auto", { accounts: nextAccounts });
    pushNotification({ title: "Conta criada", message: `${input.name} foi adicionada ao seu mapa financeiro.`, kind: "success" });
  }, [accounts, persistWorkspace, pushNotification, saveBackupSnapshot]);

  const updateAccount = useCallback(async (id: string, input: AccountInput) => {
    const nextAccounts = accounts.map(account => account.id === id ? { ...account, ...input } : account);

    setAccounts(nextAccounts);
    persistWorkspace({ accounts: nextAccounts });
    saveBackupSnapshot("auto", { accounts: nextAccounts });
    pushNotification({ title: "Conta atualizada", message: "Os dados da conta foram salvos.", kind: "success" });
  }, [accounts, persistWorkspace, pushNotification, saveBackupSnapshot]);

  const deleteAccount = useCallback(async (id: string) => {
    const nextAccounts = accounts.filter(account => account.id !== id);

    setAccounts(nextAccounts);
    persistWorkspace({ accounts: nextAccounts });
    saveBackupSnapshot("auto", { accounts: nextAccounts });
    pushNotification({ title: "Conta removida", message: "A conta saiu do seu mapa financeiro.", kind: "info" });
  }, [accounts, persistWorkspace, pushNotification, saveBackupSnapshot]);

  const changePlan = useCallback(async (plan: User["plan"]) => {
    if (!user) return;

    const nextUser = { ...user, plan };
    setUser(nextUser);
    const savedUser = updateLocalAccountUser(nextUser);
    setUser(savedUser);
    pushNotification({ title: "Plano atualizado", message: `Seu plano agora Ã© ${plan}.`, kind: "success" });
  }, [pushNotification, user]);

  const refresh = useCallback(async () => {
    if (!user) return;
    loadWorkspace(user);
  }, [loadWorkspace, user]);

  return {
    mode,
    token,
    user,
    notifications,
    transactions,
    deletedTransactions,
    monthTransactions,
    categories: categoriesWithSpent,
    accounts,
    settings,
    monthlyGoals,
    monthlyClosures,
    recurringTransactions,
    backupSnapshots,
    selectedMonthlyGoal,
    selectedMonthlyClosure,
    stats,
    monthly,
    selectedMonth,
    selectedMonthLabel,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    loading,
    error,
    locked,
    login,
    register,
    logout,
    lockApp,
    unlockWithPin,
    setSecurityPin,
    clearSecurityPin,
    completeOnboarding,
    updateProfile,
    markNotificationsRead,
    clearNotifications,
    addTransaction,
    addInstallmentTransaction,
    importTransactions,
    updateTransaction,
    duplicateTransaction,
    toggleTransactionStatus,
    deleteTransaction,
    restoreTransaction,
    deleteTransactionForever,
    emptyTrash,
    clearTransactions,
    exportBackup,
    importBackup,
    createManualSnapshot,
    restoreSnapshot,
    saveMonthlyGoal,
    closeSelectedMonth,
    reopenSelectedMonth,
    addRecurringTransaction,
    toggleRecurringTransaction,
    deleteRecurringTransaction,
    generateRecurringForSelectedMonth,
    saveSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    addAccount,
    updateAccount,
    deleteAccount,
    changePlan,
    refresh,
  };
}
