import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { OrderController } from "../controllers/order.controller";

const router = Router();
const ctrl = new OrderController();

// /api/orders
router.post("/", protect, asyncHandler(ctrl.createFromCart.bind(ctrl)));
router.get("/me", protect, asyncHandler(ctrl.myOrders.bind(ctrl)));

// ✅ NEW: /api/orders/:id (user can only access own order)
router.get("/:id", protect, asyncHandler(ctrl.getMyOrderById.bind(ctrl)));

router.put("/:id/cancel", protect, asyncHandler(ctrl.cancelMyOrder.bind(ctrl)));

export default router;
