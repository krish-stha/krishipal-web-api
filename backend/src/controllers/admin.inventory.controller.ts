import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { InventoryService } from "../services/inventory.service";

const service = new InventoryService();

export class AdminInventoryController {
  // POST /api/admin/inventory/stock-in { productId, qty, reason? }
  async stockIn(req: AuthRequest, res: Response) {
    const { productId, qty, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new HttpError(400, "Invalid productId");

    const result = await service.stockIn({
      productId,
      qty: Number(qty),
      actorId: req.user?.id ?? null,
      reason: String(reason ?? ""),
    });

    return res.status(200).json({ success: true, data: result });
  }

  // POST /api/admin/inventory/stock-out { productId, qty, reason? }
  async stockOut(req: AuthRequest, res: Response) {
    const { productId, qty, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new HttpError(400, "Invalid productId");

    const result = await service.stockOutAtomic({
      productId,
      qty: Number(qty),
      type: "STOCK_OUT",
      actorId: req.user?.id ?? null,
      reason: String(reason ?? ""),
    });

    return res.status(200).json({ success: true, data: result });
  }

  // GET /api/admin/inventory/logs?page=&limit=&productId=&type=
  async logs(req: AuthRequest, res: Response) {
    const result = await service.listLogs({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 20),
      productId: String(req.query.productId ?? ""),
      type: String(req.query.type ?? ""),
    });

    return res.status(200).json({ success: true, data: result.data, meta: result.meta });
  }

  // GET /api/admin/inventory/low-stock?threshold=5
  async lowStock(req: AuthRequest, res: Response) {
    const threshold = Number(req.query.threshold ?? 5);
    const data = await service.lowStock(threshold);
    return res.status(200).json({ success: true, data });
  }
}