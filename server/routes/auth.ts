import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { UserModel } from "../models/User";
import { createDefaultWorkspace } from "../utils/defaults";
import { serializeUser } from "../utils/serializers";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(1, "Informe a senha."),
});

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

router.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const alreadyExists = await UserModel.exists({ email: input.email });
    if (alreadyExists) {
      res.status(409).json({ message: "Já existe uma conta com esse e-mail." });
      return;
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await UserModel.create({ name: input.name, email: input.email, passwordHash });
    await createDefaultWorkspace(String(user._id));

    res.status(201).json({ token: signToken(String(user._id)), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await UserModel.findOne({ email: input.email });
    if (!user) {
      res.status(401).json({ message: "E-mail ou senha incorretos." });
      return;
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ message: "E-mail ou senha incorretos." });
      return;
    }

    await createDefaultWorkspace(String(user._id));
    res.json({ token: signToken(String(user._id)), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado." });
      return;
    }
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
