import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { uploadProfilePicture } from "../middleware/upload";
import { asyncHandler } from "../middleware/async.middleware";
import { multerErrorHandler } from "../middleware/multer_error.middleware";
const router = Router();
const controller = new AuthController();

router.post("/register", asyncHandler(controller.register.bind(controller)));
router.post("/login", asyncHandler(controller.login.bind(controller)));

router.get("/me", protect, asyncHandler(controller.me.bind(controller)));

router.post(
  "/upload-profile-picture",
  protect,
  uploadProfilePicture.single("profilePicture"),
  asyncHandler(controller.uploadProfilePicture.bind(controller))
);

router.put(
  "/:id",
  protect,
  uploadProfilePicture.single("profilePicture"),
  multerErrorHandler,
  asyncHandler(controller.updateProfile.bind(controller))
);

export default router;
