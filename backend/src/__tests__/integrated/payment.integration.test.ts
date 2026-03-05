import request from "supertest";
import app from "../../app";
import axios from "axios";
import crypto from "crypto";
import mongoose from "mongoose";

import { registerTestUser, loginTestUser } from "../helpers/test-auth";
import { OrderModel } from "../../models/order.model";
import { ProductModel } from "../../models/product.model";
import { CartModel } from "../../models/cart.model";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// must match your validateStrongPassword middleware rules
const DEFAULT_PASSWORD = "Password@123!";

// helpers ------------------------------------------------------

async function createOrderForUser(token: string, paymentMethod: "KHALTI" | "ESEWA" = "KHALTI") {
  // create minimal product
  const product = await ProductModel.create({
    name: "Test Product",
    slug: `test-product-${Date.now()}`,
    sku: `SKU-${Date.now()}`,
    description: "desc",
    price: 100,
    discountPrice: null,
    stock: 50,
    images: [],
    category: new mongoose.Types.ObjectId(), // your schema expects category
    status: "active",
    deleted_at: null,
  });

  // ensure user has empty cart
  await CartModel.updateOne(
    { user: (await OrderModel.db.model("User").findOne({}))._id }, // safe no-op for multi-user env
    { $set: { items: [] } },
    { upsert: true }
  ).catch(() => {});

  // add to cart (your cart route)
  const addRes = await request(app)
    .post("/api/cart/items")
    .set("Authorization", `Bearer ${token}`)
    .send({ productId: String(product._id), qty: 2 });

  expect([200, 201]).toContain(addRes.status);

  // create order from cart
  const orderRes = await request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${token}`)
    .send({ address: "Kathmandu", paymentMethod });

  expect(orderRes.status).toBe(201);
  return orderRes.body.data;
}

function buildEsewaSignature(fields: Record<string, any>, signedFieldNames: string, secret: string) {
  const msg = signedFieldNames
    .split(",")
    .map((k) => `${k.trim()}=${String(fields[k.trim()] ?? "")}`)
    .join(",");

  return crypto.createHmac("sha256", secret).update(msg).digest("base64");
}

// -------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // default mocks
  mockedAxios.post.mockResolvedValue({ data: {} } as any);
  mockedAxios.get.mockResolvedValue({ data: {} } as any);

  // avoid "missing env" in controller
  process.env.ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "test_esewa_secret";
  process.env.ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
});

describe("Payments Integration", () => {
  it("POST /api/payments/khalti/initiate success", async () => {
    const { email } = await registerTestUser({ password: DEFAULT_PASSWORD });
    const loginRes = await loginTestUser(email, DEFAULT_PASSWORD);
    expect(loginRes.status).toBe(200);

    const token = loginRes.body.token;
    const order = await createOrderForUser(token, "KHALTI");

    mockedAxios.post.mockResolvedValueOnce({
      data: { pidx: "pidx_123", payment_url: "https://khalti.com/pay/abc" },
    } as any);

    const res = await request(app)
      .post("/api/payments/khalti/initiate")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderId: String(order._id) });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pidx).toBe("pidx_123");
  });

  it("POST /api/payments/esewa/initiate returns formFields", async () => {
    const { email } = await registerTestUser({ password: DEFAULT_PASSWORD });
    const loginRes = await loginTestUser(email, DEFAULT_PASSWORD);
    const token = loginRes.body.token;

    const order = await createOrderForUser(token, "ESEWA");

    const res = await request(app)
      .post("/api/payments/esewa/initiate")
      .set("Authorization", `Bearer ${token}`)
      .send({ orderId: String(order._id) });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(res.body.data.formUrl).toBeDefined();
    expect(res.body.data.formFields).toBeDefined();

    // order should be updated
    const updated = await OrderModel.findById(order._id).lean();
    expect(String(updated?.paymentGateway || "").toUpperCase()).toBe("ESEWA");
    expect(String(updated?.paymentStatus || "").toLowerCase()).toBe("initiated");
    expect(updated?.paymentRef).toBeTruthy();
  });

  it("POST /api/payments/esewa/verify rejects invalid base64 payload", async () => {
    const { email } = await registerTestUser({ password: DEFAULT_PASSWORD });
    const loginRes = await loginTestUser(email, DEFAULT_PASSWORD);
    const token = loginRes.body.token;

    const order = await createOrderForUser(token, "ESEWA");

    // ensure paymentRef exists (verify checks this)
    await OrderModel.updateOne(
      { _id: order._id },
      { $set: { paymentRef: "TXN_BAD_BASE64", paymentGateway: "ESEWA", paymentStatus: "initiated" } }
    );

    const res = await request(app)
      .post("/api/payments/esewa/verify") // ✅ public
      .send({ orderId: String(order._id), data: "NOT_BASE64!!!" });

    expect(res.status).toBe(400);
    expect(String(res.body?.message || "")).toMatch(/invalid/i);
  });

  it("POST /api/payments/esewa/verify rejects signature mismatch", async () => {
    const { email } = await registerTestUser({ password: DEFAULT_PASSWORD });
    const loginRes = await loginTestUser(email, DEFAULT_PASSWORD);
    const token = loginRes.body.token;

    const order = await createOrderForUser(token, "ESEWA");

    await OrderModel.updateOne(
      { _id: order._id },
      { $set: { paymentRef: "TXN_SIG_MISMATCH", paymentGateway: "ESEWA", paymentStatus: "initiated" } }
    );

    const payload: any = {
      signed_field_names: "total_amount,transaction_uuid,product_code",
      total_amount: "200.00",
      transaction_uuid: "TXN_SIG_MISMATCH",
      product_code: process.env.ESEWA_PRODUCT_CODE!,
      status: "COMPLETE",
      signature: "WRONG_SIGNATURE",
    };

    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");

    const res = await request(app)
      .post("/api/payments/esewa/verify")
      .send({ orderId: String(order._id), data: base64 });

    expect(res.status).toBe(400);
    expect(String(res.body?.message || "")).toMatch(/signature/i);
  });

  it("POST /api/payments/esewa/verify marks paid when status check COMPLETE", async () => {
    const { email } = await registerTestUser({ password: DEFAULT_PASSWORD });
    const loginRes = await loginTestUser(email, DEFAULT_PASSWORD);
    const token = loginRes.body.token;

    const order = await createOrderForUser(token, "ESEWA");

    await OrderModel.updateOne(
      { _id: order._id },
      { $set: { paymentRef: "TXN_COMPLETE", paymentGateway: "ESEWA", paymentStatus: "initiated" } }
    );

    const secret = process.env.ESEWA_SECRET_KEY!;
    const signed_field_names = "total_amount,transaction_uuid,product_code";

    const payload: any = {
      signed_field_names,
      total_amount: "200.00",
      transaction_uuid: "TXN_COMPLETE",
      product_code: process.env.ESEWA_PRODUCT_CODE!,
      status: "COMPLETE",
    };

    payload.signature = buildEsewaSignature(payload, signed_field_names, secret);

    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");

    // status check says COMPLETE
    mockedAxios.get.mockResolvedValueOnce({ data: { status: "COMPLETE" } } as any);

    const res = await request(app)
      .post("/api/payments/esewa/verify")
      .send({ orderId: String(order._id), data: base64 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await OrderModel.findById(order._id).lean();
    expect(String(updated?.paymentStatus || "").toLowerCase()).toBe("paid");
    expect(updated?.paidAt).toBeTruthy();
  });
});