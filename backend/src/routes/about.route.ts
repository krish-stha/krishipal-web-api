import { Router } from "express";
import { PublicAboutController } from "../controllers/public.about.controller";

const router = Router();
const ctrl = new PublicAboutController();

// GET /api/about
router.get("/about", (req, res) => ctrl.get(req, res));

export default router;