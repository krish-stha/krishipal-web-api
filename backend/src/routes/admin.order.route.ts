import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { AdminOrderController } from "../controllers/admin.order.controller";

const router = Router();
const ctrl = new AdminOrderController();

// /api/admin/orders
router.get("/orders", protect, adminOnly, asyncHandler(ctrl.list.bind(ctrl)));
router.get("/orders/:id/invoice", protect, adminOnly, asyncHandler(ctrl.downloadInvoice.bind(ctrl)));

router.get("/orders/:id", protect, adminOnly, asyncHandler(ctrl.getById.bind(ctrl)));
router.put("/orders/:id/status", protect, adminOnly, asyncHandler(ctrl.updateStatus.bind(ctrl)));

export default router;
