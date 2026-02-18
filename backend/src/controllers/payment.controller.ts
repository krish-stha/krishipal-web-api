import { Response } from "express";
import mongoose from "mongoose";
import axios from "axios";
import path from "path";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { OrderModel } from "../models/order.model";
import { PaymentLogModel } from "../models/payment_log.model";
import { RefundRequestModel } from "../models/refund_request.model";
import { UserModel } from "../models/user.model";
import { generateInvoicePdfBuffer } from "../services/invoice.service";
import { sendPaymentReceiptEmail } from "../services/mail.service";

function mustUserId(req: AuthRequest) {
  const userId = req.user?.id;
  if (!userId) throw new HttpError(401, "Not authorized");
  return userId;
}

const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || "";
const KHALTI_API_BASE = process.env.KHALTI_API_BASE || "https://a.khalti.com/api/v2";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const COMPANY_NAME = process.env.COMPANY_NAME || "KrishiPal";
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "Nepal";
const COMPANY_LOGO_PATH = process.env.COMPANY_LOGO_PATH || path.join(process.cwd(), "public", "logo.png");

async function logPayment(params: {
  orderId: string;
  userId: string;
  gateway: "KHALTI" | "COD" | "ESEWA";
  action: any;
  status: "success" | "failed" | "pending";
  amountPaisa: number;
  ref?: string | null;
  message?: string | null;
  payload?: any;
}) {
  try {
    await PaymentLogModel.create({
      order: params.orderId,
      user: params.userId,
      gateway: params.gateway,
      action: params.action,
      status: params.status,
      amountPaisa: params.amountPaisa,
      ref: params.ref ?? null,
      message: params.message ?? null,
      payload: params.payload ?? null,
    });
  } catch (e) {
    console.error("❌ PaymentLog create failed:", (e as any)?.message || e);
  }
}

export class PaymentController {
  // POST /api/payments/khalti/initiate
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

    const amountPaisa = Math.round(Number(order.total || 0) * 100);
    if (!Number.isFinite(amountPaisa) || amountPaisa < 100) {
      throw new HttpError(400, "Invalid order amount");
    }

    const purchase_order_id = String(order._id);
    const purchase_order_name = `Order ${purchase_order_id.slice(-6)}`;

    const return_url = `${FRONTEND_URL}/payments/khalti/callback?orderId=${purchase_order_id}`;
    const website_url = FRONTEND_URL;

    // optional: use real user info if you want
    const payload = {
      return_url,
      website_url,
      amount: amountPaisa,
      purchase_order_id,
      purchase_order_name,
      customer_info: { name: "KrishiPal User", email: "test@example.com" },
    };

    await logPayment({
      orderId,
      userId,
      gateway: "KHALTI",
      action: "INITIATE",
      status: "pending",
      amountPaisa,
      payload,
      ref: null,
      message: "Initiate called",
    });

    let khaltiRes: any;
    try {
      khaltiRes = await axios.post(`${KHALTI_API_BASE}/epayment/initiate/`, payload, {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Khalti initiate failed";

      await logPayment({
        orderId,
        userId,
        gateway: "KHALTI",
        action: "INITIATE",
        status: "failed",
        amountPaisa,
        payload: err?.response?.data || msg,
        ref: null,
        message: msg,
      });

      throw new HttpError(400, msg);
    }

    const data = khaltiRes?.data || {};
    const pidx = String(data?.pidx || "");
    const payment_url = String(data?.payment_url || "");

    if (!pidx || !payment_url) {
      await logPayment({
        orderId,
        userId,
        gateway: "KHALTI",
        action: "INITIATE",
        status: "failed",
        amountPaisa,
        payload: data,
        ref: null,
        message: "Khalti initiate response invalid",
      });
      throw new HttpError(400, "Khalti initiate response invalid");
    }

    order.paymentGateway = "KHALTI";
    order.paymentStatus = "initiated";
    order.paymentRef = pidx;
    order.paymentMeta = data;
    await order.save();

    await logPayment({
      orderId,
      userId,
      gateway: "KHALTI",
      action: "INITIATE",
      status: "success",
      amountPaisa,
      ref: pidx,
      payload: data,
      message: "Initiated successfully",
    });

    return res.status(200).json({ success: true, data: { pidx, payment_url } });
  }

  // POST /api/payments/khalti/verify
  async khaltiVerify(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    const orderId = String(req.body?.orderId || "").trim();
    const pidx = String(req.body?.pidx || "").trim();

    if (!mongoose.Types.ObjectId.isValid(orderId)) throw new HttpError(400, "Invalid orderId");
    if (!pidx) throw new HttpError(400, "pidx is required");

    const order = await OrderModel.findOne({ _id: orderId, user: userId, deleted_at: null });
    if (!order) throw new HttpError(404, "Order not found");

    const amountPaisa = Math.round(Number(order.total || 0) * 100);

    await logPayment({
      orderId,
      userId,
      gateway: "KHALTI",
      action: "VERIFY",
      status: "pending",
      amountPaisa,
      ref: pidx,
      message: "Verify called",
      payload: { orderId, pidx },
    });

    if (order.paymentStatus === "paid") {
      await logPayment({
        orderId,
        userId,
        gateway: "KHALTI",
        action: "VERIFY",
        status: "success",
        amountPaisa,
        ref: order.paymentRef || pidx,
        message: "Already paid",
        payload: order.paymentMeta || null,
      });
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
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Khalti verify failed";

      await logPayment({
        orderId,
        userId,
        gateway: "KHALTI",
        action: "VERIFY",
        status: "failed",
        amountPaisa,
        ref: pidx,
        message: msg,
        payload: err?.response?.data || msg,
      });

      throw new HttpError(400, msg);
    }

    const info = khaltiLookup?.data || {};
    const status = String(info?.status || "").toLowerCase();

    order.paymentGateway = "KHALTI";
    order.paymentMeta = info;
    order.paymentRef = pidx;

    if (status === "completed") {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
      await order.save();

      await logPayment({
        orderId,
        userId,
        gateway: "KHALTI",
        action: "VERIFY",
        status: "success",
        amountPaisa,
        ref: info?.transaction_id || pidx,
        payload: info,
        message: "Payment completed",
      });

      // ✅ Auto email with invoice
      try {
        const user = await UserModel.findById(userId).select("fullName email").lean();
        
        if (user?.email) {
          const invoicePdf = await generateInvoicePdfBuffer({
            order: order.toObject(),
            user,
            company: { name: COMPANY_NAME, address: COMPANY_ADDRESS },
            logoPath: COMPANY_LOGO_PATH,
            
          }
        );
          

          await sendPaymentReceiptEmail({
            to: user.email,
            userName: user.fullName,
            orderId: String(order._id),
            total: Number(order.total || 0),
            gateway: "KHALTI",
            invoicePdf,
          });
        }
      } catch (e: any) {
        console.error("❌ Payment receipt email failed:", e?.message || e);
      }

      return res.status(200).json({ success: true, data: order.toObject() });
    }

    // not completed
    order.paymentStatus = status === "pending" ? "initiated" : "failed";
    await order.save();

    await logPayment({
      orderId,
      userId,
      gateway: "KHALTI",
      action: "VERIFY",
      status: "failed",
      amountPaisa,
      ref: pidx,
      payload: info,
      message: `Payment not completed: ${info?.status || "UNKNOWN"}`,
    });

    throw new HttpError(400, `Payment not completed: ${info?.status || "UNKNOWN"}`);
  }

  // ✅ POST /api/payments/refund/request
  // body: { orderId, amount?: number (Rs), reason?: string }
// POST /api/payments/refunds/request
// body: { orderId, amount, reason }
// amount = rupees (eg 10) OR you can send paisa - choose 1 format and stick to it
// ✅ POST /api/payments/refund/request  (or /refunds/request)
// body: { orderId, amount, reason }
// amount = rupees
async requestRefund(req: AuthRequest, res: Response) {
  const userId = mustUserId(req);

  const orderId = String(req.body?.orderId || "").trim();
  const reason = String(req.body?.reason || "").trim();
  const amountRs = Number(req.body?.amount || 0);

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new HttpError(400, "Invalid orderId");
  if (!Number.isFinite(amountRs) || amountRs <= 0) throw new HttpError(400, "Invalid refund amount");

  const order = await OrderModel.findOne({ _id: orderId, user: userId, deleted_at: null }).lean();
  if (!order) throw new HttpError(404, "Order not found");

  // ✅ only paid orders
  if (String(order.paymentStatus).toLowerCase() !== "paid") {
    throw new HttpError(400, "Refund available only for paid orders");
  }

  // ✅ only pending/confirmed (your requirement)
  const st = String(order.status || "").toLowerCase();
  if (!["pending", "confirmed"].includes(st)) {
    throw new HttpError(400, "Refund allowed only for pending/confirmed orders");
  }

  const orderTotalRs = Number(order.total || 0);
  if (amountRs > orderTotalRs) throw new HttpError(400, `Refund amount exceeds order total (max ${orderTotalRs})`);

  const amountPaisa = Math.round(amountRs * 100);

  // ✅ prevent requesting more than total across multiple requests
  const existing = await RefundRequestModel.find({
    order: order._id,
    user: order.user,
    status: { $in: ["requested", "approved", "processed"] },
  }).lean();

  const alreadyRequestedPaisa = existing.reduce((sum, r) => sum + Number(r.amountPaisa || 0), 0);
  if (alreadyRequestedPaisa + amountPaisa > Math.round(orderTotalRs * 100)) {
    const maxRemaining = Math.max(0, Math.round(orderTotalRs * 100) - alreadyRequestedPaisa);
    throw new HttpError(400, `Refund exceeds remaining limit. Max remaining Rs. ${Math.floor(maxRemaining / 100)}`);
  }

  const refundReq = await RefundRequestModel.create({
    order: order._id,
    user: order.user,
    amountPaisa,
    reason: reason || null,
    status: "requested",
  });

  return res.status(201).json({ success: true, data: refundReq });
}

async myRefundRequests(req: AuthRequest, res: Response) {
  const userId = mustUserId(req);

  const rows = await RefundRequestModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return res.status(200).json({ success: true, data: rows });
}



}
