import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import { createUserAndGetToken } from "../helpers/test-auth";
import { CategoryModel } from "../../models/category.model";
import { ProductModel } from "../../models/product.model";
import { CartModel } from "../../models/cart.model";

describe("Cart Integration", () => {
  async function seedCategoryAndProduct(overrides?: Partial<any>) {
    const cat = await CategoryModel.create({
      name: "Seeds",
      slug: `seeds-${Date.now()}`,
      deleted_at: null,
    });

    const prod = await ProductModel.create({
      name: overrides?.name ?? "Wheat Seeds",
      slug: overrides?.slug ?? `wheat-${Date.now()}`,
      sku: overrides?.sku ?? `SKU-${Date.now()}`,
      description: "Test product",
      price: overrides?.price ?? 100,
      discountPrice: overrides?.discountPrice ?? null,
      stock: overrides?.stock ?? 10,
      images: [],
      category: cat._id,
      status: overrides?.status ?? "active",
      deleted_at: null,
    });

    return { cat, prod };
  }

  it("GET /api/cart returns empty cart for new user", async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it("POST /api/cart/items adds item (push path) and snapshots price", async () => {
    const { token } = await createUserAndGetToken();
    const { prod } = await seedCategoryAndProduct({ price: 200, stock: 10 });

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(prod._id), qty: 2 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const items = res.body.data.items;
    expect(items.length).toBe(1);
    expect(String(items[0].product._id)).toBe(String(prod._id));
    expect(items[0].qty).toBe(2);
    expect(items[0].priceSnapshot).toBe(200);
  });

  it("POST /api/cart/items increments qty if item already exists (inc path)", async () => {
    const { token, email } = await createUserAndGetToken();
    const { prod } = await seedCategoryAndProduct({ price: 150, stock: 10 });

    // get userId from token by hitting /api/auth/me (your API has it)
    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    const userId = me.body.data._id;

    // Pre-create cart with item so controller uses "inc" branch
    await CartModel.create({
      user: new mongoose.Types.ObjectId(userId),
      items: [{ product: prod._id, qty: 1, priceSnapshot: 150 }],
    });

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(prod._id), qty: 2 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const item = res.body.data.items.find(
      (it: any) => String(it.product._id) === String(prod._id)
    );
    expect(item).toBeDefined();
    expect(item.qty).toBe(3);
    expect(item.priceSnapshot).toBe(150);
  });

  it("POST /api/cart/items rejects invalid productId", async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: "invalid-id", qty: 1 });

    expect(res.status).toBe(400);
  });

  it("POST /api/cart/items rejects qty <= 0", async () => {
    const { token } = await createUserAndGetToken();
    const { prod } = await seedCategoryAndProduct();

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(prod._id), qty: 0 });

    expect(res.status).toBe(400);
  });

  it("POST /api/cart/items rejects insufficient stock", async () => {
    const { token } = await createUserAndGetToken();
    const { prod } = await seedCategoryAndProduct({ stock: 1 });

    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(prod._id), qty: 5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/stock/i);
  });

  it("PUT /api/cart/items/:productId updates qty and snapshot", async () => {
    const { token } = await createUserAndGetToken();
    const { prod } = await seedCategoryAndProduct({ price: 300, discountPrice: 250, stock: 10 });

    // add first
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(prod._id), qty: 1 });

    // update qty
    const res = await request(app)
      .put(`/api/cart/items/${prod._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ qty: 4 });

    expect(res.status).toBe(200);
    const item = res.body.data.items.find(
      (it: any) => String(it.product._id) === String(prod._id)
    );
    expect(item.qty).toBe(4);
    // discountPrice should be used when present
    expect(item.priceSnapshot).toBe(250);
  });

  it("PUT /api/cart/items/:productId returns 404 if item not in cart", async () => {
    const { token } = await createUserAndGetToken();
    const { prod } = await seedCategoryAndProduct();

    const res = await request(app)
      .put(`/api/cart/items/${prod._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ qty: 2 });

    expect(res.status).toBe(404);
  });

  it("DELETE /api/cart/items/:productId removes item", async () => {
    const { token } = await createUserAndGetToken();
    const { prod } = await seedCategoryAndProduct();

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(prod._id), qty: 1 });

    const res = await request(app)
      .delete(`/api/cart/items/${prod._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBe(0);
  });

  it("DELETE /api/cart clears cart", async () => {
    const { token } = await createUserAndGetToken();
    const { prod } = await seedCategoryAndProduct();

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(prod._id), qty: 1 });

    const res = await request(app)
      .delete(`/api/cart`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
  });
});