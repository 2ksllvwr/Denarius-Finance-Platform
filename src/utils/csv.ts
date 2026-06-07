import type { TransactionInput } from "@/hooks/useFinanceApp";

export function parseAmount(value: string) {
  const clean = value.replace(/[^\d,.-]/g, "").trim();
  if (!clean) return Number.NaN;
  if (clean.includes(",")) return Number(clean.replace(/\./g, "").replace(",", "."));
  return Number(clean);
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function splitCsvLine(line: string, separator: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === separator && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function normalizeDate(value: string) {
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const brDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return "";
}

function parseType(value: string): "income" | "expense" {
  const text = normalizeHeader(value);
  return ["income", "receita", "entrada", "credito"].includes(text) ? "income" : "expense";
}

function parseStatus(value: string): "completed" | "pending" {
  const text = normalizeHeader(value);
  return ["pending", "pendente", "aberto"].includes(text) ? "pending" : "completed";
}

export function parseCsvTransactions(text: string): TransactionInput[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = splitCsvLine(lines[0], separator).map(normalizeHeader);
  const indexOf = (...names: string[]) => names.map(name => headers.indexOf(name)).find(index => index >= 0) ?? -1;
  const indexes = {
    date: indexOf("data", "date"),
    description: indexOf("descricao", "description", "desc"),
    type: indexOf("tipo", "type"),
    category: indexOf("categoria", "category"),
    status: indexOf("status", "situacao"),
    amount: indexOf("valor", "amount", "preco"),
  };

  return lines.slice(1).map(line => {
    const values = splitCsvLine(line, separator);
    const get = (index: number) => index >= 0 ? values[index] ?? "" : "";
    const amount = Math.abs(parseAmount(get(indexes.amount)));

    return {
      date: normalizeDate(get(indexes.date)),
      description: get(indexes.description),
      type: parseType(get(indexes.type)),
      category: get(indexes.category) || "Importado",
      status: parseStatus(get(indexes.status)),
      amount,
    };
  }).filter(item => item.date && item.description && Number.isFinite(item.amount) && item.amount > 0);
}
