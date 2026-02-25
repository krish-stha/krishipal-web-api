import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { AdminAboutController } from "../controllers/admin.about.controller";
import { uploadAboutImage } from "../middleware/uploadAboutImage";

const router = Router();
const ctrl = new AdminAboutController();

// GET /api/admin/about
router.get("/about", protect, adminOnly, (req, res) => ctrl.get(req as any, res));

// PUT /api/admin/about
router.put("/about", protect, adminOnly, (req, res) => ctrl.update(req as any, res));

// POST /api/admin/about/mission-image
router.post(
  "/about/mission-image",
  protect,
  adminOnly,
  uploadAboutImage.single("image"),
  (req, res) => ctrl.uploadMissionImage(req as any, res)
);

// POST /api/admin/about/vision-image
router.post(
  "/about/vision-image",
  protect,
  adminOnly,
  uploadAboutImage.single("image"),
  (req, res) => ctrl.uploadVisionImage(req as any, res)
);

export default router;