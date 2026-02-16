import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { OrderModel } from "../models/order.model";

// ✅ import your mail function (add this in mail.service.ts as I showed)
import { sendOrderStatusEmail } from "../services/mail.service";

const ALLOWED_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export class AdminOrderController {
  // GET /api/admin/orders?page=&limit=&search=
  // Lightweight list: user basic populated
  async list(req: AuthRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const search = String(req.query.search ?? "").trim();

    const filter: any = { deleted_at: null };

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

    const status = String(req.body?.status ?? "").trim().toLowerCase();
    if (!ALLOWED_STATUS.includes(status as any)) {
      throw new HttpError(400, `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`);
    }

    // ✅ fetch order + user email first (populate is needed for email)
    const order = await OrderModel.findOne({ _id: id, deleted_at: null }).populate({
      path: "user",
      select: "fullName email",
    });

    if (!order) throw new HttpError(404, "Order not found");

    const oldStatus = String(order.status ?? "").toLowerCase();
    if (oldStatus === status) {
      // no change, no email
      return res.status(200).json({ success: true, data: order.toObject() });
    }

    order.status = status as any;
    await order.save();

    // ✅ Send email (do NOT fail API if email fails)
    const user: any = (order as any).user;
    const to = user?.email;

    if (to) {
      sendOrderStatusEmail({
        to,
        userName: user?.fullName,
        orderId: String(order._id),
        status: String(order.status),
        total: Number(order.total ?? 0),
        address: String(order.address ?? ""),
      }).catch((err: any) => {
        console.error("❌ Order status email failed:", err?.message || err);
      });
    } else {
      console.warn("⚠️ Order status email skipped: user email missing");
    }

    return res.status(200).json({ success: true, data: order.toObject() });
  }
}
