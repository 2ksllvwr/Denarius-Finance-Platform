import type { User } from "@/data/types";
import { readLocalStorage, writeLocalStorage } from "@/utils/localStore";

const LOCAL_ACCOUNTS_KEY = "fluxo.local.accounts";
const LOCAL_ACTIVE_USER_KEY = "fluxo.local.user";

interface LocalAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  plan: User["plan"];
  avatarUrl?: string;
  title?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

interface CreateLocalAccountInput {
  name: string;
  email: string;
  password: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toUser = (account: LocalAccount): User => ({
  id: account.id,
  name: account.name,
  email: account.email,
  plan: account.plan,
  avatarUrl: account.avatarUrl,
  title: account.title,
  phone: account.phone,
  bio: account.bio,
});

function readAccounts() {
  return readLocalStorage<LocalAccount[]>(LOCAL_ACCOUNTS_KEY, []);
}

function writeAccounts(accounts: LocalAccount[]) {
  writeLocalStorage(LOCAL_ACCOUNTS_KEY, accounts);
}

async function hashPassword(password: string, salt: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Este navegador não permite proteger a senha localmente.");
  }

  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function readActiveLocalUser() {
  const active = readLocalStorage<User | null>(LOCAL_ACTIVE_USER_KEY, null);
  if (!active) return null;

  const account = readAccounts().find(item => item.id === active.id);
  return account ? toUser(account) : null;
}

export function writeActiveLocalUser(user: User | null) {
  writeLocalStorage(LOCAL_ACTIVE_USER_KEY, user);
}

export async function createLocalAccount({ name, email, password }: CreateLocalAccountInput) {
  const nextName = name.trim();
  const nextEmail = normalizeEmail(email);

  if (nextName.length < 2) throw new Error("Informe seu nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) throw new Error("Informe um e-mail válido.");
  if (password.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres.");

  const accounts = readAccounts();
  if (accounts.some(account => account.email === nextEmail)) {
    throw new Error("Já existe uma conta com esse e-mail.");
  }

  const passwordSalt = globalThis.crypto.randomUUID();
  const account: LocalAccount = {
    id: globalThis.crypto.randomUUID(),
    name: nextName,
    email: nextEmail,
    passwordSalt,
    passwordHash: await hashPassword(password, passwordSalt),
    plan: "Pro",
    createdAt: new Date().toISOString(),
  };

  writeAccounts([...accounts, account]);
  return toUser(account);
}

export async function authenticateLocalAccount(email: string, password: string) {
  const account = readAccounts().find(item => item.email === normalizeEmail(email));
  if (!account) throw new Error("E-mail ou senha incorretos.");

  const passwordHash = await hashPassword(password, account.passwordSalt);
  if (passwordHash !== account.passwordHash) throw new Error("E-mail ou senha incorretos.");

  return toUser(account);
}

export function updateLocalAccountUser(user: User) {
  const nextName = user.name.trim();
  const nextEmail = normalizeEmail(user.email);

  if (nextName.length < 2) throw new Error("Informe seu nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) throw new Error("Informe um e-mail válido.");

  const accounts = readAccounts();
  if (accounts.some(account => account.id !== user.id && account.email === nextEmail)) {
    throw new Error("Já existe uma conta com esse e-mail.");
  }

  const nextUser: User = {
    ...user,
    name: nextName,
    email: nextEmail,
    avatarUrl: user.avatarUrl || undefined,
    title: user.title?.trim() || undefined,
    phone: user.phone?.trim() || undefined,
    bio: user.bio?.trim() || undefined,
  };

  writeAccounts(accounts.map(account => (
    account.id === user.id
      ? {
        ...account,
        name: nextUser.name,
        email: nextUser.email,
        plan: nextUser.plan,
        avatarUrl: nextUser.avatarUrl,
        title: nextUser.title,
        phone: nextUser.phone,
        bio: nextUser.bio,
      }
      : account
  )));
  writeActiveLocalUser(nextUser);
  return nextUser;
}
