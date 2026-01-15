import { Router } from "express";
import { protect } from "../middleware/auth.middleware";

import {
  createAddressBatch,
  getAllAddressBatches,
  getAddressBatchById,
  updateAddressBatch,
} from "../controllers/address_batch_controller";

const router = Router();

router.post("/", protect, createAddressBatch);
router.get("/", getAllAddressBatches);
router.get("/:id", getAddressBatchById);
router.put("/:id", protect, updateAddressBatch);

export default router;
