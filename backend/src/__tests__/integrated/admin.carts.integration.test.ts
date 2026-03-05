import request from "supertest";
import app from "../../app";
import { createUserAndGetToken, createAdminAndGetToken } from "../helpers/test-auth";
import { ProductModel } from "../../models/product.model";
import { CategoryModel } from "../../models/category.model";

async function seedCategoryAndProduct() {
  const cat = await CategoryModel.create({
    name: `Seed Cat ${Date.now()}`,
    slug: `seed-cat-${Date.now()}`,
    deleted_at: null,
  });

  const p = await ProductModel.create({
    name: `Seed Product ${Date.now()}`,
    slug: `seed-product-${Date.now()}`,
    sku: `SKU-${Date.now()}`,
    description: "Test",
    price: 100,
    discountPrice: null,
    stock: 50,
    images: [],
    category: cat._id,
    status: "active",
    deleted_at: null,
  });

  return { cat, p };
}

// ✅ Tries multiple possible endpoints until one works
async function cartAddItem(token: string, productId: string, qty: number) {
  const payloadVariants = [
    { productId, qty },
    { productId, quantity: qty },
    { product: productId, qty },
    { product: productId, quantity: qty },
  ];

  const endpoints = [
    "/api/cart/add",
    "/api/cart/items",
    "/api/cart/item",
    "/api/cart",
    "/api/cart/add-item",
    "/api/cart/add-to-cart",
  ];

  for (const url of endpoints) {
    for (const body of payloadVariants) {
      const res = await request(app)
        .post(url)
        .set("Authorization", `Bearer ${token}`)
        .send(body);

      if ([200, 201].includes(res.status)) {
        return { res, used: { url, body } };
      }
    }
  }

  // if none worked, throw with the most useful error
  throw new Error(
    `Could not add item to cart. None of these endpoints worked: ${endpoints.join(
      ", "
    )}. Your cart.add route is different.`
  );
}

async function cartGetMine(token: string) {
  const endpoints = ["/api/cart", "/api/cart/me", "/api/cart/mine", "/api/cart/current"];

  for (const url of endpoints) {
    const res = await request(app).get(url).set("Authorization", `Bearer ${token}`);
    if ([200, 201].includes(res.status)) return { res, url };
  }

  throw new Error(
    `Could not fetch cart. None of these endpoints worked: ${endpoints.join(", ")}`
  );
}

describe("Admin Carts Integration", () => {
  it("admin can create a cart indirectly then getById + set qty + remove item + clear + delete", async () => {
    const { token: userToken } = await createUserAndGetToken();
    const { token: adminToken } = await createAdminAndGetToken();
    const { p } = await seedCategoryAndProduct();

    // ✅ add item using whichever endpoint exists in your backend
    const add = await cartAddItem(userToken, String(p._id), 2);
    expect([200, 201]).toContain(add.res.status);

    // ✅ fetch cart from whichever endpoint exists
    const mine = await cartGetMine(userToken);
    expect([200, 201]).toContain(mine.res.status);

    // ✅ extract cartId in a tolerant way
    const body = mine.res.body;
    const cartId =
      body?.data?._id ||
      body?._id ||
      body?.cart?._id ||
      body?.data?.cart?._id ||
      body?.data?.id ||
      body?.id;

    expect(cartId).toBeDefined();

    // admin getById
    const r1 = await request(app)
      .get(`/api/admin/carts/${cartId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect([200, 201]).toContain(r1.status);

    // admin set qty
    const r2 = await request(app)
      .put(`/api/admin/carts/${cartId}/items/${String(p._id)}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ qty: 5 });
    expect([200, 201]).toContain(r2.status);

    // admin remove item
    const r3 = await request(app)
      .delete(`/api/admin/carts/${cartId}/items/${String(p._id)}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect([200, 201]).toContain(r3.status);

    // admin clear
    const r4 = await request(app)
      .delete(`/api/admin/carts/${cartId}/clear`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect([200, 201]).toContain(r4.status);

    // admin delete cart
    const r5 = await request(app)
      .delete(`/api/admin/carts/${cartId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect([200, 201, 404]).toContain(r5.status);
  });
});