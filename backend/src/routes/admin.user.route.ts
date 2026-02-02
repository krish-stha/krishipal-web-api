import { Router } from "express";
import { AdminUserController } from "../controllers/admin.user.controller";
import { protect } from "../middleware/auth.middleware";
import { adminOnly } from "../middleware/admin.middleware";
import { uploadProfilePicture } from "../middleware/upload";
import { asyncHandler } from "../middleware/async.middleware";

const router = Router();
const controller = new AdminUserController();

// /api/admin/users/*
router.post(
  "/users",
  protect,
  adminOnly,
  uploadProfilePicture.single("profilePicture"),
  asyncHandler(controller.create.bind(controller))
);

router.get("/users", protect, adminOnly, asyncHandler(controller.list.bind(controller)));
router.get("/users/:id", protect, adminOnly, asyncHandler(controller.getById.bind(controller)));

router.put(
  "/users/:id",
  protect,
  adminOnly,
  uploadProfilePicture.single("profilePicture"),
  asyncHandler(controller.update.bind(controller))
);

router.delete("/users/:id", protect, adminOnly, asyncHandler(controller.remove.bind(controller)));
router.delete("/users/:id/hard", protect, adminOnly, asyncHandler(controller.hardRemove.bind(controller)));


export default router;
