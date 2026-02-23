import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { AdminSettingsController } from "../controllers/admin.settings.controller";

const router = Router();
const ctrl = new AdminSettingsController();

// GET /api/admin/settings
router.get("/settings", protect, adminOnly, (req, res) => ctrl.get(req as any, res));

// PUT /api/admin/settings
router.put("/settings", protect, adminOnly, (req, res) => ctrl.update(req as any, res));

export default router;