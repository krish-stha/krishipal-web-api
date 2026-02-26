import request from "supertest";
import app from "../../app";
import { createAdminAndGetToken } from "../helpers/test-auth";

describe("Admin Product Integration", () => {
  it("CRUD products (admin)", async () => {
    const { token } = await createAdminAndGetToken();

    // Create category first
    const cat = await request(app)
      .post("/api/admin/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Cat ${Date.now()}` });

    expect([200, 201]).toContain(cat.status);
    const categoryId = cat.body?.data?._id || cat.body?._id;
    expect(categoryId).toBeTruthy();

    // CREATE product (multipart because your route uses uploadProductImages.array)
    const sku = `SKU-${Date.now()}`;
    const create = await request(app)
      .post("/api/admin/products")
      .set("Authorization", `Bearer ${token}`)
      .field("name", `Product ${Date.now()}`)
      .field("sku", sku)
      .field("price", "100")
      .field("stock", "10")
      .field("categoryId", String(categoryId))
      .field("status", "active"); // your service default is active

    expect([200, 201]).toContain(create.status);
    const productId = create.body?.data?._id || create.body?._id;
    expect(productId).toBeTruthy();

    // LIST
    const list = await request(app)
      .get("/api/admin/products")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(list.status);

    // GET
    const getOne = await request(app)
      .get(`/api/admin/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(getOne.status);

    // UPDATE (multipart)
    const upd = await request(app)
      .put(`/api/admin/products/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Updated Name")
      .field("price", "120");

    expect([200, 201]).toContain(upd.status);

    // SOFT DELETE
    const del = await request(app)
      .delete(`/api/admin/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(del.status);
  });
});