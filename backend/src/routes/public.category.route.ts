import { Router } from "express";
import { asyncHandler } from "../middleware/async.middleware";
import { PublicCategoryController } from "../controllers/public.category.controller";

const router = Router();
const ctrl = new PublicCategoryController();

// /api/categories
router.get("/", asyncHandler(ctrl.list.bind(ctrl)));

export default router;
