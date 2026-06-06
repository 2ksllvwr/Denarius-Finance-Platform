import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { connectDatabase } from "./config/db";
import { assertServerEnv, env } from "./config/env";
import authRoutes from "./routes/auth";
import billingRoutes from "./routes/billing";
import categoriesRoutes from "./routes/categories";
import exportRoutes from "./routes/export";
import settingsRoutes from "./routes/settings";
import summaryRoutes from "./routes/summary";
import transactionsRoutes from "./routes/transactions";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "DENARIUS-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/billing", billingRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: "Dados inválidos.", errors: error.issues });
    return;
  }

  const message = error instanceof Error ? error.message : "Erro interno.";
  const status = message.includes("E11000") ? 409 : 500;
  res.status(status).json({ message: status === 409 ? "Registro duplicado." : message });
});

async function bootstrap() {
  assertServerEnv();
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`DENARIUS API rodando em http://localhost:${env.port}/api`);
  });
}

bootstrap().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
