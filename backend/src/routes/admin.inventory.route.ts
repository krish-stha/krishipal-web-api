import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { AdminInventoryController } from "../controllers/admin.inventory.controller";

const router = Router();
const ctrl = new AdminInventoryController();

// /api/admin/inventory/...
router.post("/inventory/stock-in", protect, adminOnly, asyncHandler(ctrl.stockIn.bind(ctrl)));
router.post("/inventory/stock-out", protect, adminOnly, asyncHandler(ctrl.stockOut.bind(ctrl)));

router.get("/inventory/logs", protect, adminOnly, asyncHandler(ctrl.logs.bind(ctrl)));
router.get("/inventory/low-stock", protect, adminOnly, asyncHandler(ctrl.lowStock.bind(ctrl)));

export default router;