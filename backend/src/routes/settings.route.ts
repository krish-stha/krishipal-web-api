import { Router } from "express";
import { asyncHandler } from "../middleware/async.middleware";
import { SettingsService } from "../services/settings.service";

const router = Router();
const service = new SettingsService();

// GET /api/settings/public  (safe for frontend)
router.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const s = await service.getOrCreate();

    // only return safe fields needed for checkout + UI
    return res.status(200).json({
      success: true,
      data: {
        storeName: s.storeName,
        storeAddress: s.storeAddress,
        storeEmail: s.storeEmail,
        storePhone: s.storePhone,
        storeLogo:s.storeLogo,
        shippingFeeDefault: s.shippingFeeDefault,
        freeShippingThreshold: s.freeShippingThreshold,
        lowStockThreshold: s.lowStockThreshold, // optional; can help UI too
        payments: s.payments,
      },
    });
  })
);

export default router;