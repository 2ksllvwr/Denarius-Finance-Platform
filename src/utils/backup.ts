import type { BackupSnapshot, DenariusBackup } from "@/data/types";

export function createBackupSnapshot(payload: DenariusBackup, reason: BackupSnapshot["reason"]): BackupSnapshot {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    reason,
    transactionCount: payload.transactions.length,
    categoryCount: payload.categories.length,
    monthlyGoalCount: payload.monthlyGoals.length,
    recurringCount: payload.recurringTransactions.length,
    payload,
  };
}

export function downloadBackupFile(backup: DenariusBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `DENARIUS-backup-${backup.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(text: string): DenariusBackup {
  const parsed = JSON.parse(text) as Partial<DenariusBackup>;

  if (
    parsed.app !== "DENARIUS" ||
    parsed.version !== 1 ||
    !parsed.user ||
    !Array.isArray(parsed.transactions) ||
    !Array.isArray(parsed.categories) ||
    !parsed.settings ||
    !Array.isArray(parsed.monthlyGoals) ||
    !Array.isArray(parsed.monthlyClosures) ||
    !Array.isArray(parsed.recurringTransactions)
  ) {
    throw new Error("Arquivo de backup inválido.");
  }

  return parsed as DenariusBackup;
}
