import { Router } from "express";
import { AdminCategoryController } from "../controllers/admin.category.controller";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { asyncHandler } from "../middleware/async.middleware";

const router = Router();
const ctrl = new AdminCategoryController();

// /api/admin/categories
router.get("/categories", protect, adminOnly, asyncHandler(ctrl.list.bind(ctrl)));
router.post("/categories", protect, adminOnly, asyncHandler(ctrl.create.bind(ctrl)));

router.get("/categories/:id", protect, adminOnly, asyncHandler(ctrl.getById.bind(ctrl)));
router.put("/categories/:id", protect, adminOnly, asyncHandler(ctrl.update.bind(ctrl)));
router.delete("/categories/:id", protect, adminOnly, asyncHandler(ctrl.remove.bind(ctrl)));

export default router;
