import { Router } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { UserModel } from "../models/User.js";
import { serializeUser } from "../utils/serializers.js";

const router = Router();
router.use(requireAuth);

const plans = [
  { id: "Free", name: "Free", price: 0, features: ["Até 50 transações", "Categorias básicas", "Exportação CSV"] },
  { id: "Pro", name: "Pro", price: 29.9, features: ["Transações ilimitadas", "Orçamentos", "Exportação CSV/PDF", "Relatórios"] },
  { id: "Business", name: "Business", price: 79.9, features: ["Multiusuário preparado", "Relatórios avançados", "Suporte prioritário"] },
];

router.get("/plans", (_req, res) => {
  res.json({ plans });
});

router.patch("/plan", async (req: AuthRequest, res, next) => {
  try {
    const plan = typeof req.body.plan === "string" ? req.body.plan : "";
    if (!["Free", "Pro", "Business"].includes(plan)) {
      res.status(400).json({ message: "Plano inválido." });
      return;
    }

    const user = await UserModel.findByIdAndUpdate(req.userId, { $set: { plan } }, { new: true });
    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado." });
      return;
    }
    res.json({ user: serializeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/checkout", (_req, res) => {
  res.status(501).json({
    message: "Checkout preparado, mas nenhum gateway foi configurado. Integre Stripe, Mercado Pago ou outro provedor aqui.",
  });
});

export default router;
