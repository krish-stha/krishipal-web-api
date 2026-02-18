import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { CartModel } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { OrderModel } from "../models/order.model";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { generateInvoicePdfBuffer } from "../services/invoice.service";
import { UserModel } from "../models/user.model"; // only if you want customer name/email on invoice



function mustUserId(req: AuthRequest) {
  const userId = req.user?.id;
  if (!userId) throw new HttpError(401, "Not authorized");
  return userId;
}

function computeSubtotalFromCart(cart: any) {
  const items = cart?.items || [];
  return items.reduce((sum: number, it: any) => {
    const qty = Number(it.qty ?? 0);
    const snap = Number(it.priceSnapshot ?? 0);
    return sum + qty * snap;
  }, 0);
}

export class OrderController {
  // POST /api/orders
  // body: { address?: string, paymentMethod?: "COD" }
  async createFromCart(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);

    const address = String(req.body?.address ?? "").trim();
    const paymentMethod = String(req.body?.paymentMethod ?? "COD").trim();

    if (!address) throw new HttpError(400, "Address is required");
    if (paymentMethod !== "COD") throw new HttpError(400, "Only COD supported for now");

    // 1) load cart (NO heavy populate; we only need ids + qty + snapshot)
    const cart = await CartModel.findOne({ user: userId }).lean();
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new HttpError(400, "Cart is empty");
    }

    // 2) validate products in bulk
    const productIds = cart.items.map((it: any) => it.product).filter(Boolean);
    const products = await ProductModel.find({
      _id: { $in: productIds },
      deleted_at: null,
      status: "active",
    })
      .select("name slug sku price discountPrice stock images")
      .lean();

    const byId = new Map<string, any>();
    for (const p of products) byId.set(String(p._id), p);

    // validate stock + build snapshot items
    const orderItems = cart.items.map((it: any) => {
      const pid = String(it.product);
      const p = byId.get(pid);

      if (!p) {
        throw new HttpError(400, `Product not available: ${pid}`);
      }

      const qty = Number(it.qty ?? 0);
      if (!Number.isInteger(qty) || qty < 1) {
        throw new HttpError(400, "Invalid cart qty");
      }

      const stock = Number(p.stock ?? 0);
      if (stock < qty) {
        throw new HttpError(400, `Insufficient stock for ${p.name}`);
      }

      const snap = Number(it.priceSnapshot ?? 0);
      if (!Number.isFinite(snap) || snap < 0) {
        throw new HttpError(400, "Invalid priceSnapshot in cart");
      }

      const image = Array.isArray(p.images) && p.images.length > 0 ? String(p.images[0]) : null;

      return {
        product: new mongoose.Types.ObjectId(pid),
        name: String(p.name),
        slug: String(p.slug),
        sku: String(p.sku),
        image,
        qty,
        priceSnapshot: snap,
      };
    });

    const subtotal = computeSubtotalFromCart({ items: orderItems });
    const shippingFee = 0; // ✅ for now
    const total = subtotal + shippingFee;

    // 3) Reduce stock + create order + clear cart
    // Prefer transaction if Mongo supports it; fallback if not.
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // decrement stock for each product
      for (const it of orderItems) {
        const ok = await ProductModel.updateOne(
          { _id: it.product, deleted_at: null, status: "active", stock: { $gte: it.qty } },
          { $inc: { stock: -it.qty } },
          { session }
        );

        if (ok.modifiedCount !== 1) {
          throw new HttpError(400, `Stock changed for ${it.name}, try again`);
        }
      }

      const created = await OrderModel.create(
        [
          {
            user: new mongoose.Types.ObjectId(userId),
            items: orderItems,
            subtotal,
            shippingFee,
            total,
            status: "pending",
            address,
            paymentMethod: "COD",
          },
        ],
        { session }
      );

      // clear cart
      await CartModel.updateOne({ user: userId }, { $set: { items: [] } }, { session });

      await session.commitTransaction();

      return res.status(201).json({
        success: true,
        data: created[0],
      });
    } catch (err: any) {
      try {
        await session.abortTransaction();
      } catch {}

      // Fallback if transactions not supported (single-node without replica set)
      // We do a safe sequential approach:
      // - re-check stock with conditional updates
      // - if any fail, stop and tell user
      // NOTE: This is best-effort without true atomicity.
      if (String(err?.message || "").includes("Transaction numbers are only allowed")) {
        for (const it of orderItems) {
          const ok = await ProductModel.updateOne(
            { _id: it.product, deleted_at: null, status: "active", stock: { $gte: it.qty } },
            { $inc: { stock: -it.qty } }
          );
          if (ok.modifiedCount !== 1) {
            throw new HttpError(400, `Stock changed for ${it.name}, try again`);
          }
        }

        const created = await OrderModel.create({
          user: new mongoose.Types.ObjectId(userId),
          items: orderItems,
          subtotal,
          shippingFee,
          total,
          status: "pending",
          address,
          paymentMethod: "COD",
        });

        await CartModel.updateOne({ user: userId }, { $set: { items: [] } });

        return res.status(201).json({ success: true, data: created });
      }

      throw err;
    } finally {
      session.endSession();
    }
  }

  async downloadMyInvoice(req: AuthRequest, res: Response) {
  const userId = mustUserId(req);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

  const order = await OrderModel.findOne({ _id: id, user: userId, deleted_at: null }).lean();
  if (!order) throw new HttpError(404, "Order not found");

  // ✅ allow invoice only for paid orders (recommended)
  if (String(order.paymentStatus).toLowerCase() !== "paid") {
    throw new HttpError(400, "Invoice available only after payment");
  }

  const COMPANY_NAME = process.env.COMPANY_NAME || "KrishiPal";
  const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "Kathmandu, Nepal";

  // ✅ IMPORTANT: Logo must exist INSIDE BACKEND project
  // Put file here: backend/public/logo.png
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


  // GET /api/orders/:id/invoice
async downloadInvoice(req: AuthRequest, res: Response) {
  const userId = mustUserId(req);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

  const order = await OrderModel.findOne({ _id: id, user: userId, deleted_at: null }).lean();
  if (!order) throw new HttpError(404, "Order not found");

  if (String(order.paymentStatus || "").toLowerCase() !== "paid") {
    throw new HttpError(400, "Invoice available only after payment");
  }

  // ✅ PDF headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="invoice-${String(order._id).slice(-8)}.pdf"`);

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  // --- Company info (use env or hardcode for college project)
  const companyName = process.env.COMPANY_NAME || "KrishiPal";
  const companyAddress = process.env.COMPANY_ADDRESS || "Nepal";
  const companyPhone = process.env.COMPANY_PHONE || "";

  doc.fontSize(18).text(companyName, { align: "left" });
  doc.fontSize(10).fillColor("gray").text(companyAddress);
  if (companyPhone) doc.text(companyPhone);
  doc.moveDown(1);

  doc.fillColor("black").fontSize(14).text("INVOICE", { align: "right" });
  doc.fontSize(10).text(`Order ID: ${order._id}`, { align: "right" });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, { align: "right" });
  doc.moveDown(1);

  doc.fontSize(11).text(`Bill To: ${order.address}`);
  doc.moveDown(1);

  // Items header
  doc.fontSize(11).text("Items:", { underline: true });
  doc.moveDown(0.5);

  // Items
  (order.items || []).forEach((it: any) => {
    const lineTotal = Number(it.qty || 0) * Number(it.priceSnapshot || 0);
    doc.fontSize(10).text(
      `${it.name} (${it.sku})  x${it.qty}   @ Rs.${it.priceSnapshot}   = Rs.${lineTotal}`
    );
  });

  doc.moveDown(1);
  doc.fontSize(11).text(`Subtotal: Rs. ${order.subtotal}`);
  doc.text(`Shipping: Rs. ${order.shippingFee}`);
  doc.fontSize(12).text(`Total: Rs. ${order.total}`, { underline: true });

  doc.moveDown(1);
  doc.fontSize(10).fillColor("gray").text("Thank you for shopping with KrishiPal.");

  doc.end();
}


  // GET /api/orders/me
  async myOrders(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      OrderModel.find({ user: userId, deleted_at: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments({ user: userId, deleted_at: null }),
    ]);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { total, page, limit },
    });
  }

    // GET /api/orders/:id  (must belong to logged user)
  async getMyOrderById(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

    const order = await OrderModel.findOne({ _id: id, user: userId, deleted_at: null }).lean();
    if (!order) throw new HttpError(404, "Order not found");

    return res.status(200).json({ success: true, data: order });
  }

  // PUT /api/orders/:id/cancel
  // PUT /api/orders/:id/cancel
// PUT /api/orders/:id/cancel
async cancelMyOrder(req: AuthRequest, res: Response) {
  const userId = mustUserId(req);
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid order id");

  // ✅ take reason from body
  const reasonRaw = String(req.body?.reason ?? "").trim();
  const reason = reasonRaw.length ? reasonRaw.slice(0, 300) : null; // limit length

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // find order (must belong to user)
    const order = await OrderModel.findOne(
      { _id: id, user: userId, deleted_at: null },
      null,
      { session }
    );

    if (!order) throw new HttpError(404, "Order not found");

    // only pending can be cancelled
    if (order.status !== "pending") {
      throw new HttpError(400, "Only pending orders can be cancelled");
    }

    // already cancelled protection
    if ((order as any).cancelled_at) {
      await session.commitTransaction();
      return res.status(200).json({ success: true, data: order });
    }

    // restore stock
    for (const it of order.items || []) {
      const qty = Number((it as any).qty || 0);
      if (qty > 0) {
        await ProductModel.updateOne(
          { _id: (it as any).product, deleted_at: null },
          { $inc: { stock: qty } },
          { session }
        );
      }
    }

    // update order fields
    order.status = "cancelled";
    (order as any).cancelled_at = new Date();
    (order as any).cancelled_by = new mongoose.Types.ObjectId(userId);
    (order as any).cancel_reason = reason;

    await order.save({ session });

    await session.commitTransaction();

    return res.status(200).json({ success: true, data: order });
  } catch (err: any) {
    try {
      await session.abortTransaction();
    } catch {}

    // ✅ fallback if transactions not supported
    if (String(err?.message || "").includes("Transaction numbers are only allowed")) {
      const order = await OrderModel.findOne({ _id: id, user: userId, deleted_at: null });
      if (!order) throw new HttpError(404, "Order not found");

      if (order.status !== "pending") throw new HttpError(400, "Only pending orders can be cancelled");
      if ((order as any).cancelled_at) return res.status(200).json({ success: true, data: order });

      for (const it of order.items || []) {
        const qty = Number((it as any).qty || 0);
        if (qty > 0) {
          await ProductModel.updateOne(
            { _id: (it as any).product, deleted_at: null },
            { $inc: { stock: qty } }
          );
        }
      }

      order.status = "cancelled";
      (order as any).cancelled_at = new Date();
      (order as any).cancelled_by = new mongoose.Types.ObjectId(userId);
      (order as any).cancel_reason = reason;

      await order.save();

      return res.status(200).json({ success: true, data: order });
    }

    throw err;
  } finally {
    session.endSession();
  }
}



}
