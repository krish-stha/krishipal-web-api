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
import crypto from "crypto";

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




// ...

const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "";
const ESEWA_FORM_URL = process.env.ESEWA_FORM_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_URL = process.env.ESEWA_STATUS_URL || "https://uat.esewa.com.np/api/epay/transaction/status/";

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

function toEsewaAmountRs(n: any) {
  const v = Number(n ?? 0);
  // eSewa typically expects rupees as string; keep 2 decimals safe
  return v.toFixed(2);
}

function buildSignedFieldString(fields: Record<string, any>, signedFieldNames: string) {
  return signedFieldNames
    .split(",")
    .map((k) => {
      const key = k.trim();
      return `${key}=${String(fields[key] ?? "")}`;
    })
    .join(",");
}

function hmacSha256Base64(secret: string, message: string) {
  return crypto.createHmac("sha256", secret).update(message).digest("base64");
}

function safeBase64JsonDecode(data: string) {
  const json = Buffer.from(data, "base64").toString("utf8");
  return JSON.parse(json);
}

export class PaymentController {
  // POST /api/payments/khalti/initiate
  async khaltiInitiate(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);
    const orderId = String(req.body?.orderId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(orderId)) throw new HttpError(400, "Invalid orderId");

    const order = await OrderModel.findOne({ _id: orderId, user: userId, deleted_at: null });


    
    if (!order) throw new HttpError(404, "Order not found");

// ✅ allow payment only in these statuses
const st = String(order.status || "").toLowerCase();

if (!["pending", "confirmed", "shipped"].includes(st)) {
  throw new HttpError(400, "Payment allowed only for pending/confirmed/shipped orders");
}

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

    order.paymentMethod = "KHALTI"; // ✅ important
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
        const user = await UserModel.findById(userId)
  .select("fullName email countryCode phone")
  .lean();

if (user?.email) {
  const cc = String((user as any)?.countryCode || "").trim();
  const ph = String((user as any)?.phone || "").trim();
  const customerPhone = ph ? `${cc}${ph}` : "-";

  const invoicePdf = await generateInvoicePdfBuffer({
    order: order.toObject(),
    company: { name: COMPANY_NAME, address: COMPANY_ADDRESS },
    logoPath: COMPANY_LOGO_PATH,

    // ✅ pass customer explicitly (strongest + no confusion)
    customer: {
      name: (user as any)?.fullName || "-",
      email: (user as any)?.email || "-",
      phone: customerPhone,
    },
  });

  await sendPaymentReceiptEmail({
    to: (user as any).email,
    userName: (user as any).fullName,
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

// POST /api/payments/esewa/initiate
async esewaInitiate(req: AuthRequest, res: Response) {
  const userId = mustUserId(req);
  const orderId = String(req.body?.orderId || "").trim();

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new HttpError(400, "Invalid orderId");

  const order = await OrderModel.findOne({ _id: orderId, user: userId, deleted_at: null });
  if (!order) throw new HttpError(404, "Order not found");

  // ✅ allow payment only in these statuses (same as Khalti)
  const st = String(order.status || "").toLowerCase();
  if (!["pending", "confirmed", "shipped"].includes(st)) {
    throw new HttpError(400, "Payment allowed only for pending/confirmed/shipped orders");
  }

  if (order.paymentStatus === "paid") {
    return res.status(200).json({ success: true, data: { alreadyPaid: true } });
  }

  if (!ESEWA_SECRET_KEY) throw new HttpError(500, "ESEWA_SECRET_KEY missing in env");

  const amountPaisa = Math.round(Number(order.total || 0) * 100);
  if (!Number.isFinite(amountPaisa) || amountPaisa < 100) throw new HttpError(400, "Invalid order amount");

  // ✅ transaction_uuid (unique reference)
  const transaction_uuid = `KP-${String(order._id).slice(-10)}-${Date.now()}`;

  // ✅ redirect to FRONTEND callback (works in localhost)
  const success_url = `${FRONTEND_URL}/payments/esewa/callback/${String(order._id)}`;
  const failure_url = `${FRONTEND_URL}/payments/esewa/failure/${String(order._id)}`;

  const total_amount = toEsewaAmountRs(order.total);

  // minimal safe values (you can add service/delivery charge if you want)
  const formFields: any = {
    amount: total_amount,
    tax_amount: "0",
    total_amount: total_amount,
    transaction_uuid,
    product_code: ESEWA_PRODUCT_CODE,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url,
    failure_url,
    signed_field_names: "total_amount,transaction_uuid,product_code",
  };

  const message = buildSignedFieldString(formFields, formFields.signed_field_names);
  formFields.signature = hmacSha256Base64(ESEWA_SECRET_KEY, message);

  await logPayment({
    orderId,
    userId,
    gateway: "ESEWA",
    action: "INITIATE",
    status: "pending",
    amountPaisa,
    ref: transaction_uuid,
    message: "eSewa initiate called",
    payload: { formFields, formUrl: ESEWA_FORM_URL },
  });

  // ✅ Update order like Khalti
  order.paymentMethod = "ESEWA";
  order.paymentGateway = "ESEWA";
  order.paymentStatus = "initiated";
  order.paymentRef = transaction_uuid;
  order.paymentMeta = { initiatedAt: new Date(), transaction_uuid };
  await order.save();

  await logPayment({
    orderId,
    userId,
    gateway: "ESEWA",
    action: "INITIATE",
    status: "success",
    amountPaisa,
    ref: transaction_uuid,
    message: "eSewa initiated successfully",
    payload: { formFields, formUrl: ESEWA_FORM_URL },
  });

  return res.status(200).json({
    success: true,
    data: {
      formUrl: ESEWA_FORM_URL,
      formFields,
    },
  });
}

// POST /api/payments/esewa/verify
// ✅ POST /api/payments/esewa/verify (PUBLIC)
async esewaVerify(req: any, res: Response) {
  const orderId = String(req.body?.orderId || "").trim();
  const data = String(req.body?.data || "").trim(); // base64 json

  if (!mongoose.Types.ObjectId.isValid(orderId)) throw new HttpError(400, "Invalid orderId");
  if (!data) throw new HttpError(400, "data is required");

  // ✅ PUBLIC: do NOT require userId for gateway callback
  const order = await OrderModel.findOne({ _id: orderId, deleted_at: null });
  if (!order) throw new HttpError(404, "Order not found");

  const userId = String(order.user); // for logs/email only
  const amountPaisa = Math.round(Number(order.total || 0) * 100);

  await logPayment({
    orderId,
    userId,
    gateway: "ESEWA",
    action: "VERIFY",
    status: "pending",
    amountPaisa,
    ref: order.paymentRef || null,
    message: "eSewa verify called",
    payload: { orderId, hasData: true },
  });

  // ✅ If already paid, return
  if (String(order.paymentStatus || "").toLowerCase() === "paid") {
    await logPayment({
      orderId,
      userId,
      gateway: "ESEWA",
      action: "VERIFY",
      status: "success",
      amountPaisa,
      ref: order.paymentRef || null,
      message: "Already paid",
      payload: order.paymentMeta || null,
    });
    return res.status(200).json({ success: true, data: order.toObject() });
  }

  if (!ESEWA_SECRET_KEY) throw new HttpError(500, "ESEWA_SECRET_KEY missing in env");

  // 1) Decode base64 response
  let resp: any;
  try {
    resp = safeBase64JsonDecode(data);
  } catch {
    await logPayment({
      orderId,
      userId,
      gateway: "ESEWA",
      action: "VERIFY",
      status: "failed",
      amountPaisa,
      ref: order.paymentRef || null,
      message: "Invalid eSewa data payload (base64 decode failed)",
      payload: { dataPreview: data.slice(0, 20) + "..." },
    });
    throw new HttpError(400, "Invalid eSewa data payload");
  }

  // 2) Signature verify
  const signedFieldNames = String(resp?.signed_field_names || "").trim();
  const signature = String(resp?.signature || "").trim();

  if (!signedFieldNames || !signature) {
    await logPayment({
      orderId,
      userId,
      gateway: "ESEWA",
      action: "VERIFY",
      status: "failed",
      amountPaisa,
      ref: order.paymentRef || null,
      message: "Missing signature fields in eSewa response",
      payload: resp,
    });
    throw new HttpError(400, "Invalid eSewa response (missing signature)");
  }

  const msg = buildSignedFieldString(resp, signedFieldNames);
  const expectedSig = hmacSha256Base64(ESEWA_SECRET_KEY, msg);

  if (expectedSig !== signature) {
    await logPayment({
      orderId,
      userId,
      gateway: "ESEWA",
      action: "VERIFY",
      status: "failed",
      amountPaisa,
      ref: order.paymentRef || null,
      message: "Signature mismatch",
      payload: { resp, expectedSig },
    });
    throw new HttpError(400, "eSewa signature verification failed");
  }

  // 3) Extract fields
  const transaction_uuid = String(resp?.transaction_uuid || "").trim();
  const total_amount = Number(resp?.total_amount || 0).toFixed(2);
  const product_code = String(resp?.product_code || "").trim();
  const statusFromEsewa = String(resp?.status || "").toUpperCase();

  if (!transaction_uuid || !total_amount || !product_code) {
    throw new HttpError(400, "Invalid eSewa response fields");
  }

  // ✅ CRITICAL: Must match the initiated reference you saved
  if (String(order.paymentRef || "") !== transaction_uuid) {
    await logPayment({
      orderId,
      userId,
      gateway: "ESEWA",
      action: "VERIFY",
      status: "failed",
      amountPaisa,
      ref: transaction_uuid,
      message: "Transaction UUID mismatch with order.paymentRef",
      payload: { orderPaymentRef: order.paymentRef, transaction_uuid },
    });
    throw new HttpError(400, "Transaction UUID mismatch");
  }

  // 4) Server-to-server status check (most reliable)
  let statusResp: any;
const totalAmountFixed = Number(total_amount).toFixed(2);

try {
  statusResp = await axios.get(ESEWA_STATUS_URL, {
    params: {
      product_code,
      total_amount: totalAmountFixed,
      transaction_uuid,
    },
    timeout: 15000,
  });
} catch (e: any) {
  console.log("ESEWA STATUS ERROR:", {
    url: ESEWA_STATUS_URL,
    message: e?.message,
    status: e?.response?.status,
    data: e?.response?.data,
    params: { product_code, total_amount: totalAmountFixed, transaction_uuid },
  });

  await logPayment({
    orderId,
    userId,
    gateway: "ESEWA",
    action: "VERIFY",
    status: "failed",
    amountPaisa,
    ref: transaction_uuid,
    message: "eSewa status check failed",
    payload: {
      errMessage: e?.message,
      errStatus: e?.response?.status,
      errData: e?.response?.data,
      product_code,
      total_amount,
      transaction_uuid,
    },
  });

  throw new HttpError(400, "eSewa status check failed");
}

  const stInfo = statusResp?.data || {};
  const stStatus = String(stInfo?.status || "").toUpperCase(); // expect COMPLETE

  // Save meta always
  order.paymentGateway = "ESEWA";
  order.paymentMeta = { resp, statusCheck: stInfo };

  // ✅ Mark paid only if COMPLETE
  if (stStatus === "COMPLETE") {
    order.paymentStatus = "paid";
    order.paidAt = new Date();
    await order.save();

    await logPayment({
      orderId,
      userId,
      gateway: "ESEWA",
      action: "VERIFY",
      status: "success",
      amountPaisa,
      ref: transaction_uuid,
      message: "Payment COMPLETE",
      payload: { resp, statusCheck: stInfo },
    });

    // ✅ Email receipt + invoice (same as you did)
    try {
      const user = await UserModel.findById(userId).select("fullName email countryCode phone").lean();

      if (user?.email) {
        const cc = String((user as any)?.countryCode || "").trim();
        const ph = String((user as any)?.phone || "").trim();
        const customerPhone = ph ? `${cc}${ph}` : "-";

        const invoicePdf = await generateInvoicePdfBuffer({
          order: order.toObject(),
          company: { name: COMPANY_NAME, address: COMPANY_ADDRESS },
          logoPath: COMPANY_LOGO_PATH,
          customer: {
            name: (user as any)?.fullName || "-",
            email: (user as any)?.email || "-",
            phone: customerPhone,
          },
        });

        await sendPaymentReceiptEmail({
          to: (user as any).email,
          userName: (user as any).fullName,
          orderId: String(order._id),
          total: Number(order.total || 0),
          gateway: "ESEWA",
          invoicePdf,
        });
      }
    } catch (e: any) {
      console.error("❌ eSewa receipt email failed:", e?.message || e);
    }

    return res.status(200).json({ success: true, data: order.toObject() });
  }

  // Not complete
  order.paymentStatus = statusFromEsewa === "PENDING" ? "initiated" : "failed";
  await order.save();

  await logPayment({
    orderId,
    userId,
    gateway: "ESEWA",
    action: "VERIFY",
    status: "failed",
    amountPaisa,
    ref: transaction_uuid,
    message: `Payment not COMPLETE: ${stStatus || statusFromEsewa || "UNKNOWN"}`,
    payload: { resp, statusCheck: stInfo },
  });

  throw new HttpError(400, `Payment not completed: ${stStatus || statusFromEsewa || "UNKNOWN"}`);
}

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
