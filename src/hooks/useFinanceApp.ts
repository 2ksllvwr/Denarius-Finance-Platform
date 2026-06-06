import { useCallback, useMemo, useState } from "react";
import {
  type AppNotification,
  DEFAULT_SETTINGS,
  INITIAL_CATEGORIES,
  type Category,
  type MonthlyClosure,
  type MonthlyGoal,
  type ProfileInput,
  type RecurringTransaction,
  type Settings,
  type Transaction,
  type User,
} from "@/data/types";
import { applyCategorySpent, calculateMonthlyData, calculateStats, filterTransactionsByMonth, formatMonthLabel, getDateInMonth, getMonthKey, shiftMonth } from "@/utils/finance";
import {
  authenticateLocalAccount,
  createLocalAccount,
  readActiveLocalUser,
  updateLocalAccountUser,
  writeActiveLocalUser,
} from "@/utils/localAuth";
import { readLocalStorage, writeLocalStorage } from "@/utils/localStore";

type Mode = "api" | "local";
type WorkspaceResource = "transactions" | "categories" | "settings" | "notifications" | "monthlyGoals" | "monthlyClosures" | "recurringTransactions";

const TOKEN_KEY = "fluxo.token";
const MODE_KEY = "fluxo.mode";

const workspaceKey = (userId: string, resource: WorkspaceResource) => `fluxo.local.users.${userId}.${resource}`;

interface WorkspaceData {
  transactions: Transaction[];
  categories: Category[];
  settings: Settings;
  notifications: AppNotification[];
  monthlyGoals: MonthlyGoal[];
  monthlyClosures: MonthlyClosure[];
  recurringTransactions: RecurringTransaction[];
}

export interface TransactionInput {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  status: "completed" | "pending";
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
  status: "completed" | "pending";
  active: boolean;
}

const createInitialCategories = () => INITIAL_CATEGORIES.map(category => ({ ...category, spent: 0 }));

function ensureCategoryList(categories: Category[], categoryNames: string[]) {
  const existing = new Set(categories.map(category => category.name));
  const additions = categoryNames
    .filter(name => name.trim().length > 0 && !existing.has(name))
    .map(name => {
      existing.add(name);
      return { id: crypto.randomUUID(), name, icon: "📌", color: "#6366f1", budget: 0, spent: 0 };
    });

  return additions.length > 0 ? [...categories, ...additions] : categories;
}

function readWorkspace(user: User | null): WorkspaceData {
  if (!user) {
    return {
      transactions: [],
      categories: createInitialCategories(),
      settings: { ...DEFAULT_SETTINGS },
      notifications: [],
      monthlyGoals: [],
      monthlyClosures: [],
      recurringTransactions: [],
    };
  }

  const transactions = readLocalStorage<Transaction[]>(workspaceKey(user.id, "transactions"), []);
  const categories = readLocalStorage<Category[]>(workspaceKey(user.id, "categories"), createInitialCategories());

  return {
    transactions,
    categories: applyCategorySpent(categories, transactions),
    settings: readLocalStorage<Settings>(workspaceKey(user.id, "settings"), { ...DEFAULT_SETTINGS }),
    notifications: readLocalStorage<AppNotification[]>(workspaceKey(user.id, "notifications"), []),
    monthlyGoals: readLocalStorage<MonthlyGoal[]>(workspaceKey(user.id, "monthlyGoals"), []),
    monthlyClosures: readLocalStorage<MonthlyClosure[]>(workspaceKey(user.id, "monthlyClosures"), []),
    recurringTransactions: readLocalStorage<RecurringTransaction[]>(workspaceKey(user.id, "recurringTransactions"), []),
  };
}

function writeWorkspace(user: User, workspace: Partial<WorkspaceData>) {
  if (workspace.transactions !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "transactions"), workspace.transactions);
  }

  if (workspace.categories !== undefined) {
    writeLocalStorage(workspaceKey(user.id, "categories"), workspace.categories);
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
}

export function useFinanceApp() {
  const activeUser = readActiveLocalUser();
  const activeWorkspace = readWorkspace(activeUser);

  const [mode] = useState<Mode>("local");
  const [token] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(activeUser);
  const [transactions, setTransactions] = useState<Transaction[]>(activeWorkspace.transactions);
  const [categories, setCategories] = useState<Category[]>(activeWorkspace.categories);
  const [settings, setSettings] = useState<Settings>(activeWorkspace.settings);
  const [notifications, setNotifications] = useState<AppNotification[]>(activeWorkspace.notifications);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(activeWorkspace.monthlyGoals);
  const [monthlyClosures, setMonthlyClosures] = useState<MonthlyClosure[]>(activeWorkspace.monthlyClosures);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(activeWorkspace.recurringTransactions);
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
    setCategories(nextWorkspace.categories);
    setSettings(nextWorkspace.settings);
    setNotifications(nextWorkspace.notifications);
    setMonthlyGoals(nextWorkspace.monthlyGoals);
    setMonthlyClosures(nextWorkspace.monthlyClosures);
    setRecurringTransactions(nextWorkspace.recurringTransactions);
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
        categories: createInitialCategories(),
        settings: { ...DEFAULT_SETTINGS },
        notifications: [{
          id: crypto.randomUUID(),
          title: "Conta criada",
          message: "Seu perfil offline está pronto para uso.",
          kind: "success" as const,
          createdAt: new Date().toISOString(),
          read: false,
        }],
        monthlyGoals: [],
        monthlyClosures: [],
        recurringTransactions: [],
      };

      localStorage.removeItem(TOKEN_KEY);
      writeLocalStorage(MODE_KEY, "local");
      writeActiveLocalUser(nextUser);
      writeWorkspace(nextUser, nextWorkspace);
      setUser(nextUser);
      setTransactions(nextWorkspace.transactions);
      setCategories(nextWorkspace.categories);
      setSettings(nextWorkspace.settings);
      setNotifications(nextWorkspace.notifications);
      setMonthlyGoals(nextWorkspace.monthlyGoals);
      setMonthlyClosures(nextWorkspace.monthlyClosures);
      setRecurringTransactions(nextWorkspace.recurringTransactions);
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
      persistWorkspace({ transactions, categories, settings, notifications, monthlyGoals, monthlyClosures, recurringTransactions }, user);
    }

    localStorage.removeItem(TOKEN_KEY);
    writeLocalStorage(MODE_KEY, "local");
    writeActiveLocalUser(null);
    setUser(null);
  }, [categories, monthlyClosures, monthlyGoals, notifications, persistWorkspace, recurringTransactions, settings, transactions, user]);

  const addTransaction = useCallback(async (input: TransactionInput) => {
    const transactionMonth = input.date.slice(0, 7);
    const previousMonthCategories = applyCategorySpent(categories, filterTransactionsByMonth(transactions, transactionMonth));
    const previousSpent = new Map(previousMonthCategories.map(category => [category.name, category.spent]));
    const localTransaction: Transaction = { id: crypto.randomUUID(), ...input };
    const nextTransactions = [localTransaction, ...transactions];
    const categoryExists = categories.some(category => category.name === input.category);
    const nextCategories = categoryExists
      ? categories
      : [...categories, { id: crypto.randomUUID(), name: input.category, icon: "📌", color: "#6366f1", budget: 0, spent: 0 }];
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
              title: nextPct >= 100 ? "Orçamento estourado" : "Orçamento em atenção",
              message: `${category.name} chegou a ${Math.round(nextPct)}% do orçamento.`,
              kind: "warning",
            });
          }
        });
    }
  }, [categories, persistWorkspace, pushNotification, settings.notifBudget, transactions]);

  const importTransactions = useCallback(async (inputs: TransactionInput[]) => {
    const validInputs = inputs.filter(input => (
      input.description.trim().length > 0 &&
      Number.isFinite(input.amount) &&
      input.amount > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(input.date)
    ));

    if (validInputs.length === 0) {
      pushNotification({ title: "Importação vazia", message: "Nenhuma linha válida foi encontrada no arquivo.", kind: "warning" });
      return;
    }

    const importedTransactions: Transaction[] = validInputs.map(input => ({
      id: crypto.randomUUID(),
      description: input.description.trim(),
      amount: input.amount,
      type: input.type,
      category: input.category.trim(),
      date: input.date,
      status: input.status,
    }));
    const nextTransactions = [...importedTransactions, ...transactions];
    const nextCategories = applyCategorySpent(ensureCategoryList(categories, importedTransactions.map(item => item.category)), nextTransactions);

    setTransactions(nextTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, categories: nextCategories });
    pushNotification({
      title: "Importação concluída",
      message: `${importedTransactions.length} transações foram adicionadas ao DENARIUS.`,
      kind: "success",
    });
  }, [categories, persistWorkspace, pushNotification, transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const nextTransactions = transactions.filter(transaction => transaction.id !== id);
    const nextCategories = applyCategorySpent(categories, nextTransactions);

    setTransactions(nextTransactions);
    setCategories(nextCategories);
    persistWorkspace({ transactions: nextTransactions, categories: nextCategories });
    pushNotification({ title: "Transação removida", message: "O lançamento saiu da sua lista.", kind: "info" });
  }, [categories, persistWorkspace, pushNotification, transactions]);

  const clearTransactions = useCallback(async () => {
    const nextCategories = applyCategorySpent(categories, []);

    setTransactions([]);
    setCategories(nextCategories);
    persistWorkspace({ transactions: [], categories: nextCategories });
    pushNotification({ title: "Dados limpos", message: "Todas as transações foram removidas.", kind: "warning" });
  }, [categories, persistWorkspace, pushNotification]);

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
    pushNotification({ title: "Mês fechado", message: `${selectedMonthLabel} foi salvo como fechamento mensal.`, kind: "success" });
  }, [monthlyClosures, persistWorkspace, pushNotification, selectedMonth, selectedMonthLabel, stats.balance, stats.count, stats.expense, stats.income, stats.pending]);

  const reopenSelectedMonth = useCallback(async () => {
    const nextClosures = monthlyClosures.filter(item => item.month !== selectedMonth);

    setMonthlyClosures(nextClosures);
    persistWorkspace({ monthlyClosures: nextClosures });
    pushNotification({ title: "Mês reaberto", message: `${selectedMonthLabel} voltou para edição normal.`, kind: "info" });
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
    pushNotification({ title: "Recorrência criada", message: `${recurring.description} já pode ser gerada mensalmente.`, kind: "success" });
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
    pushNotification({ title: "Recorrência removida", message: "A regra mensal saiu da sua lista.", kind: "info" });
  }, [persistWorkspace, pushNotification, recurringTransactions]);

  const generateRecurringForSelectedMonth = useCallback(async () => {
    const activeRecurring = recurringTransactions.filter(item => (
      item.active &&
      !transactions.some(transaction => transaction.recurringId === item.id && transaction.recurringMonth === selectedMonth)
    ));

    if (activeRecurring.length === 0) {
      pushNotification({ title: "Nada para gerar", message: "Todas as recorrências ativas já existem neste mês.", kind: "info" });
      return;
    }

    const generatedTransactions: Transaction[] = activeRecurring.map(item => ({
      id: crypto.randomUUID(),
      description: item.description,
      amount: item.amount,
      type: item.type,
      category: item.category,
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
      title: "Recorrências geradas",
      message: `${generatedTransactions.length} lançamentos foram criados em ${selectedMonthLabel}.`,
      kind: "success",
    });
  }, [categories, persistWorkspace, pushNotification, recurringTransactions, selectedMonth, selectedMonthLabel, transactions]);

  const saveSettings = useCallback(async (nextSettings: Settings) => {
    setSettings(nextSettings);
    persistWorkspace({ settings: nextSettings });
    pushNotification({ title: "Preferências salvas", message: "Suas configurações foram atualizadas.", kind: "success" });
  }, [persistWorkspace, pushNotification]);

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
    pushNotification({ title: "Categoria criada", message: `${category.name} já está disponível para lançamentos.`, kind: "success" });
  }, [categories, persistWorkspace, pushNotification]);

  const updateCategory = useCallback(async (id: string, category: Partial<Omit<Category, "id" | "spent">>) => {
    const nextCategories = categories.map(item => item.id === id ? { ...item, ...category } : item);

    setCategories(nextCategories);
    persistWorkspace({ categories: nextCategories });
    pushNotification({ title: "Categoria atualizada", message: "As mudanças já foram salvas.", kind: "success" });
  }, [categories, persistWorkspace, pushNotification]);

  const deleteCategory = useCallback(async (id: string) => {
    const nextCategories = categories.filter(category => category.id !== id);

    setCategories(nextCategories);
    persistWorkspace({ categories: nextCategories });
    pushNotification({ title: "Categoria removida", message: "A categoria saiu da sua lista.", kind: "info" });
  }, [categories, persistWorkspace, pushNotification]);

  const changePlan = useCallback(async (plan: User["plan"]) => {
    if (!user) return;

    const nextUser = { ...user, plan };
    setUser(nextUser);
    const savedUser = updateLocalAccountUser(nextUser);
    setUser(savedUser);
    pushNotification({ title: "Plano atualizado", message: `Seu plano agora é ${plan}.`, kind: "success" });
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
    monthTransactions,
    categories: categoriesWithSpent,
    settings,
    monthlyGoals,
    monthlyClosures,
    recurringTransactions,
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
    login,
    register,
    logout,
    updateProfile,
    markNotificationsRead,
    clearNotifications,
    addTransaction,
    importTransactions,
    deleteTransaction,
    clearTransactions,
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
    changePlan,
    refresh,
  };
}
