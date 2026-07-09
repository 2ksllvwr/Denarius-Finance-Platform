import dotenv from "dotenv";

dotenv.config();

const renderClientUrl = process.env.RENDER_EXTERNAL_HOSTNAME
  ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
  : undefined;
const clientUrl = process.env.CLIENT_URL ?? renderClientUrl ?? "http://localhost:5173";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3333),
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrl,
  clientOrigins: clientUrl.split(",").map(origin => origin.trim()).filter(Boolean),
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
};

export function getServerEnvIssues() {
  const missing: string[] = [];
  if (!env.mongodbUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (!env.smtpHost) missing.push("SMTP_HOST");
  if (!env.smtpUser) missing.push("SMTP_USER");
  if (!env.smtpPass) missing.push("SMTP_PASS");
  if (!env.emailFrom) missing.push("EMAIL_FROM");

  const issues: string[] = [];
  if (missing.length) {
    issues.push(`Variaveis obrigatorias ausentes: ${missing.join(", ")}.`);
  }

  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    issues.push("PORT precisa ser uma porta TCP valida.");
  }
  if (env.jwtSecret.length < 32) {
    issues.push("JWT_SECRET precisa ter pelo menos 32 caracteres.");
  }
  if (!Number.isInteger(env.smtpPort) || env.smtpPort < 1 || env.smtpPort > 65535) {
    issues.push("SMTP_PORT precisa ser uma porta TCP valida.");
  }
  for (const origin of env.clientOrigins) {
    try {
      new URL(origin);
    } catch {
      issues.push("CLIENT_URL precisa conter URLs validas com http:// ou https://.");
    }
  }

  return issues;
}

export function assertServerEnv() {
  const issues = getServerEnvIssues();

  if (issues.length) {
    throw new Error(`${issues.join(" ")} Copie .env.example para .env e preencha os valores.`);
  }
}
