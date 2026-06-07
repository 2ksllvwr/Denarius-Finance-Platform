import type { CategoryDocument } from "../models/Category";
import type { TransactionDocument } from "../models/Transaction";
import type { UserDocument } from "../models/User";
import type { SettingsDocument } from "../models/Settings";

export function serializeUser(user: UserDocument) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    plan: user.plan,
  };
}

export function serializeTransaction(transaction: TransactionDocument) {
  return {
    id: String(transaction._id),
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: transaction.date.toISOString().slice(0, 10),
    status: transaction.status,
    recurringId: transaction.recurringId,
    recurringMonth: transaction.recurringMonth,
  };
}

export function serializeCategory(category: CategoryDocument, spent = 0) {
  return {
    id: String(category._id),
    name: category.name,
    icon: category.icon,
    color: category.color,
    budget: category.budget,
    spent,
  };
}

export function serializeSettings(settings: SettingsDocument) {
  return {
    notifEmail: settings.notifEmail,
    notifBudget: settings.notifBudget,
    currency: settings.currency,
    onboardingCompleted: settings.onboardingCompleted,
    pinHash: settings.pinHash,
    pinSalt: settings.pinSalt,
    autoLockMinutes: settings.autoLockMinutes,
    lastBackupAt: settings.lastBackupAt?.toISOString(),
    lastAutoBackupAt: settings.lastAutoBackupAt?.toISOString(),
  };
}
