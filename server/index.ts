import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { ZodError } from "zod";
import { connectDatabase } from "./config/db";
import { assertServerEnv, env } from "./config/env";
import authRoutes from "./routes/auth";
import billingRoutes from "./routes/billing";
import categoriesRoutes from "./routes/categories";
import exportRoutes from "./routes/export";
import monthlyRoutes from "./routes/monthly";
import recurringRoutes from "./routes/recurring";
import settingsRoutes from "./routes/settings";
import summaryRoutes from "./routes/summary";
import transactionsRoutes from "./routes/transactions";
import workspaceRoutes from "./routes/workspace";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");

app.set("trust proxy", 1);
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "DENARIUS-api" });
});

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Muitas tentativas. Aguarde alguns minutos." },
}), authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/monthly", monthlyRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/workspace", workspaceRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath, { maxAge: "1y", immutable: true, index: false }));
  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ message: "Rota não encontrada." });
      return;
    }
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ message: "Rota não encontrada." });
  });
}

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ message: "Dados inválidos.", errors: error.issues });
    return;
  }

  const message = error instanceof Error ? error.message : "Erro interno.";
  const status = message.includes("E11000")
    ? 409
    : message.includes("inválida ou expirada")
      ? 400
      : 500;
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
