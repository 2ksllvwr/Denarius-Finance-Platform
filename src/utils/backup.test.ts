import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, INITIAL_ACCOUNTS, type DenariusBackup } from "@/data/types";
import { parseBackupFile } from "@/utils/backup";

const backup: DenariusBackup = {
  app: "Denarius",
  version: 1,
  exportedAt: "2026-06-06T12:00:00.000Z",
  user: { id: "u1", name: "Gustavo", email: "gustavo@example.com", plan: "Pro" },
  transactions: [],
  deletedTransactions: [],
  categories: [],
  accounts: INITIAL_ACCOUNTS,
  settings: DEFAULT_SETTINGS,
  monthlyGoals: [],
  monthlyClosures: [],
  recurringTransactions: [],
};

describe("backup utils", () => {
  it("accepts a valid Denarius backup", () => {
    expect(parseBackupFile(JSON.stringify(backup))).toEqual(backup);
  });

  it("accepts legacy uppercase backup names", () => {
    expect(parseBackupFile(JSON.stringify({ ...backup, app: "DENARIUS" }))).toEqual(backup);
  });

  it("adds default accounts and trash to legacy backups without them", () => {
    const { accounts: _accounts, deletedTransactions: _deletedTransactions, ...legacyBackup } = backup;
    expect(parseBackupFile(JSON.stringify(legacyBackup))).toEqual(backup);
  });

  it("rejects invalid backup payloads", () => {
    expect(() => parseBackupFile(JSON.stringify({ app: "OTHER" }))).toThrow("Arquivo de backup inválido.");
  });
});
