import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { AdminPaymentController } from "../controllers/admin.payment.controller";

const router = Router();
const ctrl = new AdminPaymentController();

// /api/admin/payments/...
router.get("/payments/logs", protect, adminOnly, asyncHandler(ctrl.listLogs.bind(ctrl)));

router.get("/payments/refunds", protect, adminOnly, asyncHandler(ctrl.listRefunds.bind(ctrl)));
router.put("/payments/refunds/:id/approve", protect, adminOnly, asyncHandler(ctrl.approveRefund.bind(ctrl)));
router.put("/payments/refunds/:id/reject", protect, adminOnly, asyncHandler(ctrl.rejectRefund.bind(ctrl)));
router.put("/payments/refunds/:id/processed", protect, adminOnly, asyncHandler(ctrl.markProcessed.bind(ctrl)));

export default router;
