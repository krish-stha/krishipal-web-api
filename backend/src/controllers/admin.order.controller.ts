import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { OrderModel } from "../models/order.model";

const ALLOWED_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export class AdminOrderController {
  // GET /api/admin/orders?page=&limit=&search=
  // Lightweight list: no heavy populate, only user basic
  async list(req: AuthRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const search = String(req.query.search ?? "").trim();

    const filter: any = { deleted_at: null };

    // simple search by orderId (exact) OR user email/name (via populate filter in JS)
    // We’ll keep DB query efficient and do safe JS filter after populate.
    const base = await OrderModel.find(filter)
      .select("user items subtotal total status paymentMethod createdAt updatedAt address")
      .populate({ path: "user", select: "fullName email" })
      .sort({ createdAt: -1 })
      .lean();

    let filtered = base;
    if (search) {
      const s = search.toLowerCase();
      filtered = base.filter((o: any) => {
        const id = String(o._id || "").toLowerCase();
        const n = String(o.user?.fullName ?? "").toLowerCase();
        const e = String(o.user?.email ?? "").toLowerCase();
        return id.includes(s) || n.includes(s) || e.includes(s);
      });
    }

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);

    const rows = paged.map((o: any) => {
      const itemsCount = (o.items || []).reduce((sum: number, it: any) => sum + Number(it.qty ?? 0), 0);

      return {
        _id: o._id,
        userName: o.user?.fullName ?? "-",
        userEmail: o.user?.email ?? "-",
        itemsCount,
        subtotal: Number(o.subtotal ?? 0),
        total: Number(o.total ?? 0),
        status: o.status,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { total, page, limit },
    });
  }

  // GET /api/admin/orders/:id
  // Detail can include richer info. We'll populate user only (items already snapshot).
  async getById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

    const order = await OrderModel.findOne({ _id: id, deleted_at: null })
      .populate({ path: "user", select: "fullName email phone countryCode address role" })
      .lean();

    if (!order) throw new HttpError(404, "Order not found");

    return res.status(200).json({ success: true, data: order });
  }

  // PUT /api/admin/orders/:id/status  { status }
  async updateStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

    const status = String(req.body?.status ?? "").trim();
    if (!ALLOWED_STATUS.includes(status as any)) {
      throw new HttpError(400, `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`);
    }

    const updated = await OrderModel.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { $set: { status } },
      { new: true }
    ).lean();

    if (!updated) throw new HttpError(404, "Order not found");

    return res.status(200).json({ success: true, data: updated });
  }
}
