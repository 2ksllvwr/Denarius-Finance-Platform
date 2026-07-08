import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3333),
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
};

export function assertServerEnv() {
  const missing: string[] = [];
  if (!env.mongodbUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (!env.smtpHost) missing.push("SMTP_HOST");
  if (!env.smtpUser) missing.push("SMTP_USER");
  if (!env.smtpPass) missing.push("SMTP_PASS");
  if (!env.emailFrom) missing.push("EMAIL_FROM");

  if (missing.length) {
    throw new Error(
      `Variáveis obrigatórias ausentes: ${missing.join(", ")}. Copie .env.example para .env e preencha os valores.`,
    );
  }
}
