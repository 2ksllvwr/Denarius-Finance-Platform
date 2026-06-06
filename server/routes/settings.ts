import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { SettingsModel } from "../models/Settings";
import { serializeSettings } from "../utils/serializers";

const router = Router();
router.use(requireAuth);

const settingsSchema = z.object({
  notifEmail: z.boolean().optional(),
  notifBudget: z.boolean().optional(),
  currency: z.enum(["BRL", "USD", "EUR"]).optional(),
});

async function findOrCreateSettings(userId: string) {
  return SettingsModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, notifEmail: true, notifBudget: true, currency: "BRL" } },
    { upsert: true, new: true },
  );
}

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const settings = await findOrCreateSettings(req.userId!);
    res.json({ settings: serializeSettings(settings) });
  } catch (error) {
    next(error);
  }
});

router.patch("/", async (req: AuthRequest, res, next) => {
  try {
    const input = settingsSchema.parse(req.body);
    const settings = await SettingsModel.findOneAndUpdate(
      { userId: req.userId },
      { $set: input },
      { new: true, upsert: true },
    );
    res.json({ settings: serializeSettings(settings) });
  } catch (error) {
    next(error);
  }
});

export default router;
