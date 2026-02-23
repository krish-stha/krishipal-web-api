import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { asyncHandler } from "../middleware/async.middleware";
import { AdminDashboardController } from "../controllers/admin.dashboard.controller";

const router = Router();
const ctrl = new AdminDashboardController();

// /api/admin/dashboard/summary
router.get(
  "/dashboard/summary",
  protect,
  adminOnly,
  asyncHandler(ctrl.summary.bind(ctrl))
);

export default router;