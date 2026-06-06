import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3333),
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
};

export function assertServerEnv() {
  const missing: string[] = [];
  if (!env.mongodbUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");

  if (missing.length) {
    throw new Error(
      `Variáveis obrigatórias ausentes: ${missing.join(", ")}. Copie .env.example para .env e preencha os valores.`,
    );
  }
}
