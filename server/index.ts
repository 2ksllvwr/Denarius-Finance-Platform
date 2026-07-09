import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { Server } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { ZodError } from "zod";
import { connectDatabase, disconnectDatabase, isDatabaseReady } from "./config/db.js";
import { assertServerEnv, env, getServerEnvIssues } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import billingRoutes from "./routes/billing.js";
import categoriesRoutes from "./routes/categories.js";
import exportRoutes from "./routes/export.js";
import monthlyRoutes from "./routes/monthly.js";
import recurringRoutes from "./routes/recurring.js";
import settingsRoutes from "./routes/settings.js";
import summaryRoutes from "./routes/summary.js";
import transactionsRoutes from "./routes/transactions.js";
import workspaceRoutes from "./routes/workspace.js";

const app = express();
const currentFile = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");

app.set("trust proxy", 1);
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", ...env.clientOrigins],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", async (_req, res) => {
  const issues = getServerEnvIssues();
  let database = isDatabaseReady();
  let databaseError: string | undefined;

  if (!issues.length && !database) {
    try {
      await connectDatabase();
      database = isDatabaseReady();
    } catch (error) {
      databaseError = error instanceof Error ? error.message : "Falha desconhecida ao conectar ao MongoDB.";
    }
  }

  const ok = issues.length === 0 && database;
  res.status(ok ? 200 : issues.length ? 500 : 503).json({
    ok,
    service: "DENARIUS-api",
    environment: issues.length ? "invalid" : "valid",
    database,
    issues,
    databaseError,
  });
});

app.use("/api", async (_req, _res, next) => {
  try {
    assertServerEnv();
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
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
  if (status >= 500) console.error(error);
  res.status(status).json({
    message: status === 409
      ? "Registro duplicado."
      : status >= 500 && env.nodeEnv === "production"
        ? "Não foi possível concluir a operação."
        : message,
  });
});

let server: Server | undefined;

async function shutdown(signal: string) {
  console.log(`${signal} recebido. Encerrando o DENARIUS...`);
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close(error => error ? reject(error) : resolve());
    });
  }
  await disconnectDatabase();
}

async function bootstrap() {
  assertServerEnv();
  await connectDatabase();
  server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`DENARIUS rodando na porta ${env.port} (${env.nodeEnv}).`);
  });
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectRun = entryPoint === currentFile;

if (isDirectRun) {
  bootstrap().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void shutdown(signal)
        .then(() => process.exit(0))
        .catch(error => {
          console.error(error);
          process.exit(1);
        });
    });
  }
}

export default app;
