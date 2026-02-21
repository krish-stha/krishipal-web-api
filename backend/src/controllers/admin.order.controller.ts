  import { Response } from "express";
  import mongoose from "mongoose";
  import { AuthRequest } from "../middleware/auth.middleware";
  import { HttpError } from "../errors/http-error";
  import { OrderModel } from "../models/order.model";
  import path from "path";
  import { generateInvoicePdfBuffer } from "../services/invoice.service";

  import fs from "fs";



  // ✅ import your mail function (add this in mail.service.ts as I showed)
  import { sendOrderStatusEmail } from "../services/mail.service";
  import { sendPaymentReceiptEmail } from "../services/mail.service";

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

      // GET /api/admin/orders/:id/invoice
    async downloadInvoice(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

    const order = await OrderModel.findOne({ _id: id, deleted_at: null }).lean();
    if (!order) throw new HttpError(404, "Order not found");

    if (String(order.paymentStatus).toLowerCase() !== "paid") {
      throw new HttpError(400, "Invoice available only after payment");
    }

    const COMPANY_NAME = process.env.COMPANY_NAME || "KrishiPal";
    const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "Kathmandu, Nepal";

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



    // PUT /api/admin/orders/:id/status  { status }
    // PUT /api/admin/orders/:id/status  { status }
async updateStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

  const status = String(req.body?.status ?? "").trim().toLowerCase();
  if (!ALLOWED_STATUS.includes(status as any)) {
    throw new HttpError(400, `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}`);
  }

  // ✅ fetch order + user info (needed for email + invoice customer)
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

  // ✅ if Khalti but not paid, block delivered
  if (isKhalti && isDelivered && String(order.paymentStatus).toLowerCase() !== "paid") {
    throw new HttpError(400, "Cannot mark as delivered before payment");
  }

  // ✅ update status
  order.status = status as any;

  // ✅ COD: delivered => automatically paid (only if not already)
  let codJustPaid = false;
  if (isCOD && isDelivered && String(order.paymentStatus).toLowerCase() !== "paid") {
    order.paymentStatus = "paid";
    order.paymentGateway = "COD";
    order.paidAt = new Date();
    codJustPaid = true;
  }

  await order.save();

  const user: any = (order as any).user;
  const to = user?.email;

  // ✅ Send ORDER STATUS email (optional — if you still want it)
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
  }

  // ✅ Send COD payment email ONLY when COD becomes paid on delivered
  if (codJustPaid && to) {
    try {
      const COMPANY_NAME = process.env.COMPANY_NAME || "KrishiPal";
      const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "Kathmandu, Nepal";

      const logoPath = path.resolve(process.cwd(), "public", "logo.png");
      const safeLogoPath = fs.existsSync(logoPath) ? logoPath : undefined;

      const phone = user?.phone
        ? `${String(user?.countryCode || "").trim()}${String(user?.phone || "").trim()}`.trim()
        : "-";

      const invoicePdf = await generateInvoicePdfBuffer({
        order: order.toObject(),
        company: { name: COMPANY_NAME, address: COMPANY_ADDRESS },
        logoPath: safeLogoPath,

        // ✅ IMPORTANT: so COD invoice shows name/email/phone
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
