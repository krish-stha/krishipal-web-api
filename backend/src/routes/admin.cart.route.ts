import { Router } from "express";
import { asyncHandler } from "../middleware/async.middleware";
import { protect } from "../middleware/auth.middleware";
import { AdminCartController } from "../controllers/admin.cart.controller";

const router = Router();
const ctrl = new AdminCartController();

// /api/admin/carts
router.get("/", protect, asyncHandler(ctrl.list.bind(ctrl)));
router.get("/:id", protect, asyncHandler(ctrl.getById.bind(ctrl)));

router.put("/:id/items/:productId", protect, asyncHandler(ctrl.setItemQty.bind(ctrl)));
router.delete("/:id/items/:productId", protect, asyncHandler(ctrl.removeItem.bind(ctrl)));

router.delete("/:id/clear", protect, asyncHandler(ctrl.clear.bind(ctrl)));
router.delete("/:id", protect, asyncHandler(ctrl.deleteCart.bind(ctrl)));

export default router;
