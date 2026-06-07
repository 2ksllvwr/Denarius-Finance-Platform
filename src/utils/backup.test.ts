import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type DenariusBackup } from "@/data/types";
import { parseBackupFile } from "@/utils/backup";

const backup: DenariusBackup = {
  app: "DENARIUS",
  version: 1,
  exportedAt: "2026-06-06T12:00:00.000Z",
  user: { id: "u1", name: "Gustavo", email: "gustavo@example.com", plan: "Pro" },
  transactions: [],
  categories: [],
  settings: DEFAULT_SETTINGS,
  monthlyGoals: [],
  monthlyClosures: [],
  recurringTransactions: [],
};

describe("backup utils", () => {
  it("accepts a valid DENARIUS backup", () => {
    expect(parseBackupFile(JSON.stringify(backup))).toEqual(backup);
  });

  it("rejects invalid backup payloads", () => {
    expect(() => parseBackupFile(JSON.stringify({ app: "OTHER" }))).toThrow("Arquivo de backup inválido.");
  });
});
