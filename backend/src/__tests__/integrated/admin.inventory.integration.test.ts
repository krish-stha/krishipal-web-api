import request from "supertest";
import app from "../../app";
import { createAdminAndGetToken } from "../helpers/test-auth";
import { CategoryModel } from "../../models/category.model";
import { ProductModel } from "../../models/product.model";

describe("Admin Inventory Integration", () => {
  it("stock-in, stock-out, logs, low-stock (admin)", async () => {
    const { token } = await createAdminAndGetToken();

    // ✅ Create real category for ObjectId
    const cat = await CategoryModel.create({
      name: `Inventory Cat ${Date.now()}`,
      slug: `inventory-cat-${Date.now()}`,
      deleted_at: null,
    });

    // ✅ Create product with category ObjectId
    const p = await ProductModel.create({
      name: `Inv Product ${Date.now()}`,
      slug: `inv-product-${Date.now()}`,
      sku: `INV-${Date.now()}`,
      description: "",
      price: 100,
      discountPrice: null,
      stock: 0,
      images: [],
      category: cat._id, // ✅ ObjectId
      status: "active",
      deleted_at: null,
    });

    // STOCK IN
    const inRes = await request(app)
      .post("/api/admin/inventory/stock-in")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(p._id), qty: 10, reason: "Test stock in" });

    expect([200, 201]).toContain(inRes.status);

    // STOCK OUT
    const outRes = await request(app)
      .post("/api/admin/inventory/stock-out")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(p._id), qty: 3, reason: "Test stock out" });

    expect([200, 201]).toContain(outRes.status);

    // LOGS
    const logs = await request(app)
      .get("/api/admin/inventory/logs")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(logs.status);

    // LOW STOCK
    const low = await request(app)
      .get("/api/admin/inventory/low-stock")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(low.status);
  });
});