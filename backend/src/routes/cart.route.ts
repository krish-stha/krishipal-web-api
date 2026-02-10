import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { CartController } from "../controllers/cart.controller";

const router = Router();
const ctrl = new CartController();

// /api/cart
router.get("/", protect, asyncHandler(ctrl.getMyCart.bind(ctrl)));
router.post("/items", protect, asyncHandler(ctrl.add.bind(ctrl)));
router.put("/items/:productId", protect, asyncHandler(ctrl.updateQty.bind(ctrl)));
router.delete("/items/:productId", protect, asyncHandler(ctrl.remove.bind(ctrl)));
router.delete("/", protect, asyncHandler(ctrl.clear.bind(ctrl)));

export default router;
