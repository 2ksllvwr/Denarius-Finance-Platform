import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { SettingsModel } from "../models/Settings.js";
import { serializeSettings } from "../utils/serializers.js";

const router = Router();
router.use(requireAuth);

const settingsSchema = z.object({
  notifEmail: z.boolean().optional(),
  notifBudget: z.boolean().optional(),
  currency: z.enum(["BRL", "USD", "EUR"]).optional(),
  onboardingCompleted: z.boolean().optional(),
  pinHash: z.string().optional(),
  pinSalt: z.string().optional(),
  autoLockMinutes: z.coerce.number().int().min(1).max(60).optional(),
  lastBackupAt: z.string().datetime().optional(),
  lastAutoBackupAt: z.string().datetime().optional(),
});

async function findOrCreateSettings(userId: string) {
  return SettingsModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, notifEmail: true, notifBudget: true, currency: "BRL", onboardingCompleted: false, autoLockMinutes: 5 } },
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
    const update = {
      ...input,
      lastBackupAt: input.lastBackupAt ? new Date(input.lastBackupAt) : undefined,
      lastAutoBackupAt: input.lastAutoBackupAt ? new Date(input.lastAutoBackupAt) : undefined,
    };
    const settings = await SettingsModel.findOneAndUpdate(
      { userId: req.userId },
      { $set: update },
      { new: true, upsert: true },
    );
    res.json({ settings: serializeSettings(settings) });
  } catch (error) {
    next(error);
  }
});

export default router;
