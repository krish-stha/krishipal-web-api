import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { PaymentLogModel } from "../models/payment_log.model";
import { RefundRequestModel } from "../models/refund_request.model";

export class AdminPaymentController {
  // GET /api/admin/payments/logs?page&limit&search
  async listLogs(req: AuthRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const search = String(req.query.search ?? "").trim();

    const filter: any = {};
    if (search) {
      // allow searching by orderId/pidx/txnId
      filter.$or = [
        { ref: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ order: search });
        filter.$or.push({ user: search });
      }
    }

    const [rows, total] = await Promise.all([
      PaymentLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "order", select: "_id total paymentGateway paymentStatus" })
        .populate({ path: "user", select: "fullName email" })
        .lean(),
      PaymentLogModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { total, page, limit },
    });
  }

  // GET /api/admin/payments/refunds?page&limit&status
  async listRefunds(req: AuthRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const status = String(req.query.status ?? "").trim();

    const filter: any = {};
    if (status) filter.status = status;

    const [rows, total] = await Promise.all([
      RefundRequestModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "order", select: "_id total paymentGateway paymentStatus paymentRef" })
        .populate({ path: "user", select: "fullName email" })
        .lean(),
      RefundRequestModel.countDocuments(filter),
    ]);

    return res.status(200).json({ success: true, data: rows, meta: { total, page, limit } });
  }

  // PUT /api/admin/payments/refunds/:id/approve  { adminNote? }
  async approveRefund(req: AuthRequest, res: Response) {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid refund id");

    const rr = await RefundRequestModel.findById(id);
    if (!rr) throw new HttpError(404, "Refund request not found");

    if (rr.status !== "requested") throw new HttpError(400, "Only requested refunds can be approved");

    rr.status = "approved";
    rr.adminNote = String(req.body?.adminNote || "").trim() || null;
    rr.approvedBy = new mongoose.Types.ObjectId(req.user!.id);
    rr.approvedAt = new Date();
    await rr.save();

    return res.status(200).json({ success: true, data: rr.toObject() });
  }

  // PUT /api/admin/payments/refunds/:id/reject  { adminNote? }
  async rejectRefund(req: AuthRequest, res: Response) {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid refund id");

    const rr = await RefundRequestModel.findById(id);
    if (!rr) throw new HttpError(404, "Refund request not found");

    if (rr.status !== "requested") throw new HttpError(400, "Only requested refunds can be rejected");

    rr.status = "rejected";
    rr.adminNote = String(req.body?.adminNote || "").trim() || null;
    rr.approvedBy = new mongoose.Types.ObjectId(req.user!.id);
    rr.approvedAt = new Date();
    await rr.save();

    return res.status(200).json({ success: true, data: rr.toObject() });
  }

  // PUT /api/admin/payments/refunds/:id/processed
  async markProcessed(req: AuthRequest, res: Response) {
    const id = String(req.params.id || "");
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid refund id");

    const rr = await RefundRequestModel.findById(id);
    if (!rr) throw new HttpError(404, "Refund request not found");

    if (rr.status !== "approved") throw new HttpError(400, "Only approved refunds can be processed");

    rr.status = "processed";
    rr.processedAt = new Date();
    await rr.save();

    return res.status(200).json({ success: true, data: rr.toObject() });
  }
}
