import { Router } from "express";
import { PublicProductController } from "../controllers/public.product.controller";
import { asyncHandler } from "../middleware/async.middleware";

const router = Router();
const ctrl = new PublicProductController();

// /api/products
router.get("/products", asyncHandler(ctrl.list.bind(ctrl)));
router.get("/products/:slug", asyncHandler(ctrl.getBySlug.bind(ctrl)));

export default router;
