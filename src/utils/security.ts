export function createSalt() {
  return crypto.randomUUID();
}

export async function hashSecret(secret: string, salt: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Este navegador não permite proteger o PIN localmente.");
  }

  const bytes = new TextEncoder().encode(`${salt}:${secret}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifySecret(secret: string, salt: string, expectedHash: string) {
  const hash = await hashSecret(secret, salt);
  return hash === expectedHash;
}
