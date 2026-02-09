import { Router } from "express";
import { AdminProductController } from "../controllers/admin.product.controller";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { uploadProductImages } from "../middleware/product_upload";
import { multerErrorHandler } from "../middleware/multer_error.middleware";

const router = Router();
const ctrl = new AdminProductController();

// /api/admin/products
router.get("/products", protect, adminOnly, asyncHandler(ctrl.list.bind(ctrl)));

router.post(
  "/products",
  protect,
  adminOnly,
  uploadProductImages.array("images", 6), // ✅ up to 6 images
  multerErrorHandler,
  asyncHandler(ctrl.create.bind(ctrl))
);

router.get("/products/:id", protect, adminOnly, asyncHandler(ctrl.getById.bind(ctrl)));

router.put(
  "/products/:id",
  protect,
  adminOnly,
  uploadProductImages.array("images", 6),
  multerErrorHandler,
  asyncHandler(ctrl.update.bind(ctrl))
);

router.delete("/products/:id", protect, adminOnly, asyncHandler(ctrl.remove.bind(ctrl)));
router.delete("/products/:id/hard", protect, adminOnly, asyncHandler(ctrl.hardRemove.bind(ctrl)));

export default router;
