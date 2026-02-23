// src/controllers/admin.order.controller.ts
import { Response } from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { OrderModel } from "../models/order.model";
import { generateInvoicePdfBuffer } from "../services/invoice.service";
import { sendOrderStatusEmail, sendPaymentReceiptEmail } from "../services/mail.service";
import { InventoryOrderService } from "../services/inventory.order.service";
import { SettingsService } from "../services/settings.service";

const ALLOWED_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export class AdminOrderController {
  // GET /api/admin/orders?page=&limit=&search=&from=&to=
  async list(req: AuthRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const search = String(req.query.search ?? "").trim();
    const from = String(req.query.from || "").trim(); // YYYY-MM-DD
    const to = String(req.query.to || "").trim();     // YYYY-MM-DD

    const ymd = /^\d{4}-\d{2}-\d{2}$/;
    if (from && !ymd.test(from)) throw new HttpError(400, "Invalid from date (use YYYY-MM-DD)");
    if (to && !ymd.test(to)) throw new HttpError(400, "Invalid to date (use YYYY-MM-DD)");

    const filter: any = { deleted_at: null };

    // ✅ createdAt date filter
    if (from || to) {
      const createdAt: any = {};
      if (from) createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
      filter.createdAt = createdAt;
    }

    // ✅ If you want SEARCH to be correct + fast, do it in Mongo query
    // (instead of filtering in JS after fetching everything)
    // We can only search userName/email after populate, so easiest way:
    // - keep your JS filtering OR implement aggregation. For now keep JS filtering.

    const base = await OrderModel.find(filter)
      .select("user items subtotal total status paymentMethod createdAt updatedAt address paymentStatus")
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
        paymentStatus: o.paymentStatus,
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

  // GET /api/admin/orders/:id/invoice
  async downloadInvoice(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

    const order = await OrderModel.findOne({ _id: id, deleted_at: null }).lean();
    if (!order) throw new HttpError(404, "Order not found");

    if (String(order.paymentStatus).toLowerCase() !== "paid") {
      throw new HttpError(400, "Invoice available only after payment");
    }

    const settings = await new SettingsService().getOrCreate();
    const COMPANY_NAME = settings.storeName;
    const COMPANY_ADDRESS = settings.storeAddress;

    const logoPath = path.resolve(process.cwd(), "public", "logo.png");
    const safeLogoPath = fs.existsSync(logoPath) ? logoPath : undefined;

    const pdf = await generateInvoicePdfBuffer({
      order,
      company: { name: COMPANY_NAME, address: COMPANY_ADDRESS },
      logoPath: safeLogoPath,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${id}.pdf"`);
    return res.status(200).send(pdf);
  }

  // PUT /api/admin/orders/:id/status { status }
  async updateStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

    const status = String(req.body?.status ?? "").trim().toLowerCase();
    if (!ALLOWED_STATUS.includes(status as any)) {
      throw new HttpError(400, `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`);
    }

    const order = await OrderModel.findOne({ _id: id, deleted_at: null }).populate({
      path: "user",
      select: "fullName email phone countryCode",
    });

    if (!order) throw new HttpError(404, "Order not found");

    const oldStatus = String(order.status ?? "").toLowerCase();
    if (oldStatus === status) {
      return res.status(200).json({ success: true, data: order.toObject() });
    }

    const isCOD = String(order.paymentMethod || "COD").toUpperCase() === "COD";
    const isKhalti = String(order.paymentMethod || "").toUpperCase() === "KHALTI";
    const isDelivered = status === "delivered";

    if (isKhalti && isDelivered && String(order.paymentStatus).toLowerCase() !== "paid") {
      throw new HttpError(400, "Cannot mark as delivered before payment");
    }

    order.status = status as any;

    let codJustPaid = false;
    if (isCOD && isDelivered && String(order.paymentStatus).toLowerCase() !== "paid") {
      order.paymentStatus = "paid";
      order.paymentGateway = "COD";
      order.paidAt = new Date();
      codJustPaid = true;
    }

    await order.save();

    if (codJustPaid) {
      const invOrder = new InventoryOrderService();
      await invOrder.applyPaidOrderStockOut(String(order._id), req.user?.id ?? null);
    }

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
      }).catch((err: any) => console.error("❌ Order status email failed:", err?.message || err));
    }

    if (codJustPaid && to) {
      try {
        const settings = await new SettingsService().getOrCreate();
        const COMPANY_NAME = settings.storeName;
        const COMPANY_ADDRESS = settings.storeAddress;

        const logoPath = path.resolve(process.cwd(), "public", "logo.png");
        const safeLogoPath = fs.existsSync(logoPath) ? logoPath : undefined;

        const phone = user?.phone
          ? `${String(user?.countryCode || "").trim()}${String(user?.phone || "").trim()}`.trim()
          : "-";

        const invoicePdf = await generateInvoicePdfBuffer({
          order: order.toObject(),
          company: { name: COMPANY_NAME, address: COMPANY_ADDRESS },
          logoPath: safeLogoPath,
          customer: {
            name: user?.fullName || "-",
            email: user?.email || "-",
            phone,
          },
        });

        await sendPaymentReceiptEmail({
          to,
          userName: user?.fullName,
          orderId: String(order._id),
          total: Number(order.total ?? 0),
          gateway: "COD",
          invoicePdf,
        });
      } catch (err: any) {
        console.error("❌ COD Payment email failed:", err?.message || err);
      }
    }

    return res.status(200).json({ success: true, data: order.toObject() });
  }
}