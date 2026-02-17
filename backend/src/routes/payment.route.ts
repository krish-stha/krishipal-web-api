import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { PaymentController } from "../controllers/payment.controller";

const router = Router();
const ctrl = new PaymentController();

// /api/payments/khalti/initiate
router.post("/khalti/initiate", protect, asyncHandler(ctrl.khaltiInitiate.bind(ctrl)));

// /api/payments/khalti/verify
router.post("/khalti/verify", protect, asyncHandler(ctrl.khaltiVerify.bind(ctrl)));

export default router;
