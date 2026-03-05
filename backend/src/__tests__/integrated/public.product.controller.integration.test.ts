// src/__tests__/integrated/public.product.controller.integration.test.ts
import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { ProductModel } from "../../models/product.model";
import { CategoryModel } from "../../models/category.model";

function uniqSlug(prefix = "p") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`.toLowerCase();
}

describe("Public Product Controller Integration", () => {
  it("GET /api/products returns 200 + data/meta", async () => {
    // ✅ create a real category (since Product.category is required)
    const cat = await CategoryModel.create({
      name: `Seed Category ${Date.now()}`,
      slug: uniqSlug("cat"),
      status: "active",      // common field; ok if ignored
      deleted_at: null,      // matches your soft-delete style
    } as any);

    // ✅ seed a product
    const slug = uniqSlug("list");
    await ProductModel.create({
      name: `Public Product ${Date.now()}`,
      slug,
      sku: `SKU-${Date.now()}`,
      price: 100,
      discountPrice: 0,
      stock: 10,
      images: [],
      category: cat._id,     
      status: "active",
      deleted_at: null,
    } as any);

    const res = await request(app).get("/api/products");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // controller contract
    expect(res.body.data).toBeDefined();
    expect(res.body.meta).toBeDefined();
    expect(typeof res.body.meta.page).toBe("number");
    expect(typeof res.body.meta.limit).toBe("number");
    expect(typeof res.body.meta.total).toBe("number");
  });

  it("GET /api/products/:slug returns 404 when not found", async () => {
    const res = await request(app).get(`/api/products/${uniqSlug("missing")}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(String(res.body.message || "")).toMatch(/not found/i);
  });

  it("GET /api/products/:slug returns 200 when found", async () => {
    const cat = await CategoryModel.create({
      name: `Seed Category ${Date.now()}`,
      slug: uniqSlug("cat2"),
      status: "active",
      deleted_at: null,
    } as any);

    const slug = uniqSlug("found");

    const created = await ProductModel.create({
      name: `Public Product ${Date.now()}`,
      slug,
      sku: `SKU-${Date.now()}`,
      price: 250,
      discountPrice: 200,
      stock: 5,
      images: [],
      category: cat._id, // ✅ required
      status: "active",
      deleted_at: null,
    } as any);

    const res = await request(app).get(`/api/products/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(String(res.body.data.slug)).toBe(slug);
    expect(String(res.body.data._id)).toBe(String(created._id));
  });
});