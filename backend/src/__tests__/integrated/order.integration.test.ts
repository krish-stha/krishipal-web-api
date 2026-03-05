import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";

import { createUserAndGetToken } from "../helpers/test-auth";

import { CategoryModel } from "../../models/category.model";
import { ProductModel } from "../../models/product.model";
import { CartModel } from "../../models/cart.model";
import { OrderModel } from "../../models/order.model";
import { SettingsModel } from "../../models/settings.model";
import { UserModel } from "../../models/user.model";

function oid() {
  return new mongoose.Types.ObjectId();
}

async function ensureSettingsAllPaymentsEnabled() {
  // Your controller reads settings via SettingsService.getOrCreate().
  // To avoid "COD disabled / Khalti disabled / eSewa disabled" surprises,
  // we force a settings doc with payments all true.
  const existing = await SettingsModel.findOne({});
  if (!existing) {
    await SettingsModel.create({
      payments: { COD: true, KHALTI: true, ESEWA: true },
      shippingFeeDefault: 0,
      freeShippingThreshold: null,
      lowStockThreshold: 5,
      storeName: "KrishiPal",
      storeAddress: "Kathmandu",
      storeEmail: "support@krishipal.com",
      storePhone: "",
      storeLogo: "",
    } as any);
  } else {
    await SettingsModel.updateOne(
      { _id: existing._id },
      {
        $set: {
          "payments.COD": true,
          "payments.KHALTI": true,
          "payments.ESEWA": true,
        },
      }
    );
  }
}

async function createCategory(name = "Seeds") {
  const cat = await CategoryModel.create({
    name,
    slug: `seeds-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    deleted_at: null,
  } as any);
  return cat;
}

async function createProduct(opts: {
  categoryId: mongoose.Types.ObjectId;
  name?: string;
  sku?: string;
  price?: number;
  discountPrice?: number | null;
  stock?: number;
  status?: "active" | "draft";
}) {
  const now = Date.now();
  const p = await ProductModel.create({
    name: opts.name ?? `Prod-${now}`,
    slug: `prod-${now}-${Math.random().toString(16).slice(2)}`,
    sku: (opts.sku ?? `SKU-${now}-${Math.random().toString(16).slice(2)}`).toUpperCase(),
    description: "",
    price: opts.price ?? 100,
    discountPrice: opts.discountPrice ?? null,
    stock: opts.stock ?? 10,
    images: [],
    category: opts.categoryId,
    status: opts.status ?? "active",
    deleted_at: null,
  } as any);
  return p;
}

async function setCart(userId: string, items: Array<{ productId: string; qty: number; priceSnapshot: number }>) {
  await CartModel.updateOne(
    { user: userId },
    {
      $set: {
        user: userId,
        items: items.map((it) => ({
          product: new mongoose.Types.ObjectId(it.productId),
          qty: it.qty,
          priceSnapshot: it.priceSnapshot,
        })),
      },
    },
    { upsert: true }
  );
}

describe("Orders Integration", () => {
  beforeAll(async () => {
    await ensureSettingsAllPaymentsEnabled();
  });

  it("rejects /api/orders/me without token", async () => {
    const res = await request(app).get("/api/orders/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/orders fails when address missing", async () => {
    const { token, email } = await createUserAndGetToken();

    // ensure empty cart
    const user = await UserModel.findOne({ email }).lean();
if (!user?._id) throw new Error("Test user not found after register");

await CartModel.updateOne(
  { user: user._id },
  { $set: { items: [] } },
  { upsert: true }
);
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentMethod: "COD" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/orders fails when cart empty", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    await CartModel.updateOne({ user: user!._id }, { $set: { items: [] } }, { upsert: true });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "Kathmandu", paymentMethod: "COD" });

    expect(res.status).toBe(400);
    expect(String(res.body.message || "")).toMatch(/cart is empty/i);
  });

  it("POST /api/orders rejects invalid paymentMethod", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    const cat = await createCategory("Cat-A");
    const prod = await createProduct({ categoryId: cat._id, stock: 10, price: 200 });

    await setCart(String(user!._id), [
      { productId: String(prod._id), qty: 1, priceSnapshot: 200 },
    ]);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "Kathmandu", paymentMethod: "INVALID" });

    expect(res.status).toBe(400);
    expect(String(res.body.message || "")).toMatch(/invalid paymentmethod/i);
  });

  it("POST /api/orders creates order, reduces stock, clears cart", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    const cat = await createCategory("Cat-B");
    const prod = await createProduct({ categoryId: cat._id, stock: 10, price: 150 });

    await setCart(String(user!._id), [
      { productId: String(prod._id), qty: 2, priceSnapshot: 150 },
    ]);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "Kathmandu", paymentMethod: "COD" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.items?.length).toBe(1);
    expect(res.body.data.status).toBe("pending");

    // stock decreased
    const freshProd = await ProductModel.findById(prod._id).lean();
    expect(freshProd?.stock).toBe(8);

    // cart cleared
    const freshCart = await CartModel.findOne({ user: user!._id }).lean();
    expect(Array.isArray(freshCart?.items)).toBe(true);
    expect(freshCart?.items?.length).toBe(0);
  });

  it("POST /api/orders supports selectedProductIds (partial checkout)", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    const cat = await createCategory("Cat-C");
    const p1 = await createProduct({ categoryId: cat._id, stock: 10, price: 100, name: "P1" });
    const p2 = await createProduct({ categoryId: cat._id, stock: 10, price: 200, name: "P2" });

    await setCart(String(user!._id), [
      { productId: String(p1._id), qty: 1, priceSnapshot: 100 },
      { productId: String(p2._id), qty: 1, priceSnapshot: 200 },
    ]);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        address: "Kathmandu",
        paymentMethod: "COD",
        selectedProductIds: [String(p1._id)],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items?.length).toBe(1);
    expect(String(res.body.data.items[0].product)).toBe(String(p1._id));

    // Cart should still contain the unselected item
    const freshCart = await CartModel.findOne({ user: user!._id }).lean();
    const remaining = (freshCart?.items || []).map((it: any) => String(it.product));
    expect(remaining).toContain(String(p2._id));
  });

  it("GET /api/orders/me returns list with meta", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    // create one order directly (simple)
    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "pending",
      address: "Kathmandu",
      paymentMethod: "COD",
      paymentGateway: "COD",
      deleted_at: null,
    } as any);

    const res = await request(app)
      .get("/api/orders/me?page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10 });
    expect(res.body.data.some((o: any) => String(o._id) === String(order._id))).toBe(true);
  });

  it("GET /api/orders/:id rejects invalid id", async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .get("/api/orders/invalid-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("GET /api/orders/:id returns own order", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "pending",
      address: "Kathmandu",
      paymentMethod: "COD",
      paymentGateway: "COD",
      deleted_at: null,
    } as any);

    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(String(res.body.data._id)).toBe(String(order._id));
  });

  it("PUT /api/orders/:id/cancel cancels pending order and stores reason", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "pending",
      address: "Kathmandu",
      paymentMethod: "COD",
      paymentGateway: "COD",
      deleted_at: null,
    } as any);

    const res = await request(app)
      .put(`/api/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Changed my mind" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("cancelled");
    expect(res.body.data.cancel_reason).toBe("Changed my mind");
    expect(res.body.data.cancelled_at).toBeDefined();
  });

  it("PUT /api/orders/:id/cancel rejects non-pending order", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "confirmed",
      address: "Kathmandu",
      paymentMethod: "COD",
      paymentGateway: "COD",
      deleted_at: null,
    } as any);

    const res = await request(app)
      .put(`/api/orders/${order._id}/cancel`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Too late" });

    expect(res.status).toBe(400);
    expect(String(res.body.message || "")).toMatch(/only pending/i);
  });

  it("GET /api/orders/:id/invoice rejects when not paid", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "pending",
      address: "Kathmandu",
      paymentMethod: "COD",
      paymentGateway: "COD",
      paymentStatus: "unpaid",
      deleted_at: null,
    } as any);

    const res = await request(app)
      .get(`/api/orders/${order._id}/invoice`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(String(res.body.message || "")).toMatch(/invoice available only after payment/i);
  });

  it("GET /api/orders/:id/invoice returns pdf when paid", async () => {
    const { token, email } = await createUserAndGetToken();
    const { UserModel } = await import("../../models/user.model");
    const user = await UserModel.findOne({ email }).lean();
    expect(user?._id).toBeDefined();

    const order = await OrderModel.create({
      user: user!._id,
      items: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      status: "pending",
      address: "Kathmandu",
      paymentMethod: "COD",
      paymentGateway: "COD",
      paymentStatus: "paid",
      deleted_at: null,
    } as any);

    const res = await request(app)
      .get(`/api/orders/${order._id}/invoice`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // header check
    expect(String(res.headers["content-type"] || "")).toMatch(/application\/pdf/i);
    expect(String(res.headers["content-disposition"] || "")).toMatch(/invoice-/i);
    // body exists
    expect(res.body).toBeDefined();
  });
});