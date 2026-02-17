import { Response } from "express";
import mongoose from "mongoose";
import axios from "axios";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { OrderModel } from "../models/order.model";

function mustUserId(req: AuthRequest) {
  const userId = req.user?.id;
  if (!userId) throw new HttpError(401, "Not authorized");
  return userId;
}

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || "";
const KHALTI_API_BASE = process.env.KHALTI_API_BASE || "https://a.khalti.com/api/v2";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

if (!KHALTI_SECRET_KEY) {
  console.warn("⚠️ KHALTI_SECRET_KEY missing. Khalti payments will fail.");
}

export class PaymentController {
  // POST /api/payments/khalti/initiate
  // body: { orderId }
  async khaltiInitiate(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    const orderId = String(req.body?.orderId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(orderId)) throw new HttpError(400, "Invalid orderId");

    const order = await OrderModel.findOne({ _id: orderId, user: userId, deleted_at: null });
    if (!order) throw new HttpError(404, "Order not found");

    if (order.status !== "pending") throw new HttpError(400, "Only pending orders can be paid");
    if (order.paymentStatus === "paid") {
      return res.status(200).json({ success: true, data: { alreadyPaid: true } });
    }

    const amountPaisa = Math.round(Number(order.total || 0) * 100); // Rs -> paisa
    if (!Number.isFinite(amountPaisa) || amountPaisa < 100) {
      throw new HttpError(400, "Invalid order amount");
    }

    const purchase_order_id = String(order._id);
    const purchase_order_name = `Order ${purchase_order_id.slice(-6)}`;

    const return_url = `${FRONTEND_URL}/payments/khalti/callback?orderId=${purchase_order_id}`;
    const website_url = FRONTEND_URL;

    const payload = {
      return_url,
      website_url,
      amount: amountPaisa,
      purchase_order_id,
      purchase_order_name,
      customer_info: {
        name: "KrishiPal User",
        email: "test@example.com",
      },
    };

    let khaltiRes: any;
    try {
      khaltiRes = await axios.post(`${KHALTI_API_BASE}/epayment/initiate/`, payload, {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Khalti initiate failed";
      throw new HttpError(400, msg);
    }

    const data = khaltiRes?.data || {};
    const pidx = String(data?.pidx || "");
    const payment_url = String(data?.payment_url || "");

    if (!pidx || !payment_url) throw new HttpError(400, "Khalti initiate response invalid");

    // save into order
    order.paymentGateway = "KHALTI";
    order.paymentStatus = "initiated";
    order.paymentRef = pidx;
    order.paymentMeta = data;
    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        pidx,
        payment_url,
      },
    });
  }

  // POST /api/payments/khalti/verify
  // body: { orderId, pidx }
  async khaltiVerify(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    const orderId = String(req.body?.orderId || "").trim();
    const pidx = String(req.body?.pidx || "").trim();

    if (!mongoose.Types.ObjectId.isValid(orderId)) throw new HttpError(400, "Invalid orderId");
    if (!pidx) throw new HttpError(400, "pidx is required");

    const order = await OrderModel.findOne({ _id: orderId, user: userId, deleted_at: null });
    if (!order) throw new HttpError(404, "Order not found");

    // already paid
    if (order.paymentStatus === "paid") {
      return res.status(200).json({ success: true, data: order.toObject() });
    }

    let khaltiLookup: any;
    try {
      khaltiLookup = await axios.post(
        `${KHALTI_API_BASE}/epayment/lookup/`,
        { pidx },
        {
          headers: {
            Authorization: `Key ${KHALTI_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Khalti verify failed";
      throw new HttpError(400, msg);
    }

    const info = khaltiLookup?.data || {};
    const status = String(info?.status || "").toLowerCase(); // Completed, Pending, etc

    order.paymentGateway = "KHALTI";
    order.paymentMeta = info;
    order.paymentRef = pidx;

    if (status === "completed") {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
      await order.save();
      return res.status(200).json({ success: true, data: order.toObject() });
    }

    // if not completed
    order.paymentStatus = status === "pending" ? "initiated" : "failed";
    await order.save();

    throw new HttpError(400, `Payment not completed: ${info?.status || "UNKNOWN"}`);
  }
}
