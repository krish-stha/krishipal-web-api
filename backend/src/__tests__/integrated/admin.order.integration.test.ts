import request from "supertest";
import app from "../../app";
import { createAdminAndGetToken } from "../helpers/test-auth";
import { OrderModel } from "../../models/order.model";
import { UserModel } from "../../models/user.model";

describe("Admin Orders Integration", () => {
  it("GET /api/admin/orders requires admin", async () => {
    const res = await request(app).get("/api/admin/orders");
    expect([401, 403]).toContain(res.status);
  });

  it("list + get + update status + download invoice (admin)", async () => {
    const { token, email } = await createAdminAndGetToken();

    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeTruthy();

    // create an order directly (safe minimal)
    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "pending",
      paymentStatus: "paid", // keep safe for invoice
      paymentMethod: "COD",
      paymentGateway: "COD",
      deleted_at: null,
      address: "Kathmandu",
    });

    // LIST
    const list = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(list.status);

    // GET BY ID
    const getOne = await request(app)
      .get(`/api/admin/orders/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(getOne.status);

    // UPDATE STATUS
    const upd = await request(app)
      .put(`/api/admin/orders/${order._id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "confirmed" });

    expect([200, 201]).toContain(upd.status);

    // DOWNLOAD INVOICE (pdf)
    const inv = await request(app)
      .get(`/api/admin/orders/${order._id}/invoice`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(inv.status);
    // content-type can vary; accept pdf-ish
    const ct = String(inv.headers["content-type"] || "");
    expect(ct.toLowerCase()).toContain("pdf");
  });
});