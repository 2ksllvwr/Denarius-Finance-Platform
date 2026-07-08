import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { EmailVerificationModel } from "../models/EmailVerification";
import { UserModel } from "../models/User";
import { sendVerificationCode } from "../utils/email";
import { serializeUser } from "../utils/serializers";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
  verificationToken: z.string().min(1, "Confirme seu e-mail antes de continuar."),
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(1, "Informe a senha."),
});

const verificationSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").toLowerCase(),
  purpose: z.enum(["register", "reset"]),
});

const confirmVerificationSchema = verificationSchema.extend({
  code: z.string().regex(/^\d{6}$/, "Informe o código de seis dígitos."),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email("E-mail inválido.").toLowerCase(),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
  verificationToken: z.string().min(1, "Confirme seu e-mail antes de continuar."),
});

interface EmailVerificationToken {
  email: string;
  purpose: "register" | "reset";
  type: "email-verification";
}

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

function validateVerificationToken(token: string, email: string, purpose: "register" | "reset") {
  const payload = jwt.verify(token, env.jwtSecret) as EmailVerificationToken;
  if (payload.type !== "email-verification" || payload.email !== email || payload.purpose !== purpose) {
    throw new Error("Confirmação de e-mail inválida ou expirada.");
  }
}

router.post("/email-code", async (req, res, next) => {
  try {
    const input = verificationSchema.parse(req.body);
    const accountExists = await UserModel.exists({ email: input.email });
    if (input.purpose === "register" && accountExists) {
      res.status(409).json({ message: "Já existe uma conta com esse e-mail." });
      return;
    }
    if (input.purpose === "reset" && !accountExists) {
      // Resposta neutra para não expor quais e-mails estão cadastrados.
      res.json({ message: "Se o e-mail estiver cadastrado, o código será enviado." });
      return;
    }
    const recent = await EmailVerificationModel.findOne({ email: input.email, purpose: input.purpose });
    if (recent?.updatedAt && Date.now() - recent.updatedAt.getTime() < 60_000) {
      res.status(429).json({ message: "Aguarde um minuto antes de solicitar outro código." });
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    await EmailVerificationModel.findOneAndUpdate(
      { email: input.email, purpose: input.purpose },
      { $set: { codeHash, attempts: 0, expiresAt: new Date(Date.now() + 10 * 60_000) } },
      { upsert: true, new: true },
    );
    await sendVerificationCode(input.email, code, input.purpose);
    res.json({ message: "Código enviado. Verifique sua caixa de entrada." });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-email-code", async (req, res, next) => {
  try {
    const input = confirmVerificationSchema.parse(req.body);
    const verification = await EmailVerificationModel.findOne({ email: input.email, purpose: input.purpose });
    if (!verification || verification.expiresAt.getTime() < Date.now()) {
      res.status(400).json({ message: "Código inválido ou expirado." });
      return;
    }
    if (verification.attempts >= 5) {
      res.status(429).json({ message: "Muitas tentativas. Solicite um novo código." });
      return;
    }

    const valid = await bcrypt.compare(input.code, verification.codeHash);
    if (!valid) {
      verification.attempts += 1;
      await verification.save();
      res.status(400).json({ message: "Código inválido ou expirado." });
      return;
    }

    await verification.deleteOne();
    const verificationToken = jwt.sign(
      { email: input.email, purpose: input.purpose, type: "email-verification" },
      env.jwtSecret,
      { expiresIn: "10m" },
    );
    res.json({ verificationToken });
  } catch (error) {
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    validateVerificationToken(input.verificationToken, input.email, "register");
    const alreadyExists = await UserModel.exists({ email: input.email });
    if (alreadyExists) {
      res.status(409).json({ message: "Já existe uma conta com esse e-mail." });
      return;
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await UserModel.create({ name: input.name, email: input.email, passwordHash, emailVerifiedAt: new Date() });

    res.status(201).json({ token: signToken(String(user._id)), user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const input = resetPasswordSchema.parse(req.body);
    validateVerificationToken(input.verificationToken, input.email, "reset");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await UserModel.findOneAndUpdate(
      { email: input.email },
      { $set: { passwordHash } },
      { new: true },
    );
    if (!user) {
      res.status(400).json({ message: "Não foi possível redefinir a senha." });
      return;
    }
    res.json({ message: "Senha redefinida com sucesso." });
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

router.patch("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const input = z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().toLowerCase(),
      avatarUrl: z.string().max(500_000).optional(),
      title: z.string().trim().max(80).optional(),
      phone: z.string().trim().max(30).optional(),
      bio: z.string().trim().max(500).optional(),
    }).parse(req.body);
    const currentUser = await UserModel.findById(req.userId);
    if (!currentUser) {
      res.status(404).json({ message: "Usuário não encontrado." });
      return;
    }
    if (input.email !== currentUser.email) {
      res.status(400).json({ message: "Para alterar o e-mail, confirme o novo endereço primeiro." });
      return;
    }
    const user = await UserModel.findByIdAndUpdate(req.userId, { $set: input }, { new: true, runValidators: true });
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
