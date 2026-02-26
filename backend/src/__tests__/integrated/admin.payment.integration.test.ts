import request from "supertest";
import app from "../../app";
import { createAdminAndGetToken } from "../helpers/test-auth";
import { PaymentLogModel } from "../../models/payment_log.model";
import { RefundRequestModel } from "../../models/refund_request.model";
import { OrderModel } from "../../models/order.model";
import { UserModel } from "../../models/user.model";

describe("Admin Payments Integration", () => {
  it("GET /api/admin/payments/logs (admin)", async () => {
    const { token, email } = await createAdminAndGetToken();
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeTruthy();

    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: "COD",
      paymentGateway: "COD",
      deleted_at: null,
      address: "Kathmandu",
    });

    await PaymentLogModel.create({
      order: order._id,
      user: user!._id,
      gateway: "KHALTI",
      action: "INITIATE",
      status: "pending",
      amountPaisa: 10000,
      ref: "TEST-REF",
      message: "test log",
      payload: { ok: true },
    });

    const res = await request(app)
      .get("/api/admin/payments/logs")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(res.status);
  });

  it("refund flow: list -> approve -> processed (admin)", async () => {
    const { token, email } = await createAdminAndGetToken();
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeTruthy();

    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 100,
      shippingFee: 0,
      total: 100,
      status: "pending",
      paymentStatus: "paid",
      paymentMethod: "KHALTI",
      paymentGateway: "KHALTI",
      deleted_at: null,
      address: "Kathmandu",
      paidAt: new Date(),
    });

    const rr = await RefundRequestModel.create({
      order: order._id,
      user: user!._id,
      amountPaisa: 10000,
      reason: "test",
      status: "requested",
    });

    // LIST refunds
    const list = await request(app)
      .get("/api/admin/payments/refunds")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(list.status);

    // APPROVE
    const approve = await request(app)
      .put(`/api/admin/payments/refunds/${rr._id}/approve`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(approve.status);

    // MARK PROCESSED
    const processed = await request(app)
      .put(`/api/admin/payments/refunds/${rr._id}/processed`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(processed.status);
  });
});