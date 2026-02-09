import request from "supertest";
import app from "../../app";
import {
  createAdminAndGetToken,
  createUserAndGetToken,
} from "../helpers/test-auth";

describe("Admin Users Integration", () => {
  it("lists users with admin token", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("fails without token", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("supports pagination", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(2);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it("gets user by id", async () => {
    const { token } = await createAdminAndGetToken();

    const list = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(list.status).toBe(200);
    const id = list.body.data[0]._id;

    const res = await request(app)
      .get(`/api/admin/users/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it("fails for invalid id format", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get(`/api/admin/users/invalid-id`)
      .set("Authorization", `Bearer ${token}`);

    // after your ObjectId validation fix, this should be 400
    expect([400, 404]).toContain(res.status);
  });

  it("soft deletes user", async () => {
    const { token } = await createAdminAndGetToken();

    const list = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    const id = list.body.data[0]._id;

    const res = await request(app)
      .delete(`/api/admin/users/${id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("hard deletes user", async () => {
    const { token } = await createAdminAndGetToken();

    const list = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    const id = list.body.data[0]._id;

    const res = await request(app)
      .delete(`/api/admin/users/${id}/hard`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  /* ===========================
     ✅ EXTRA TESTS (8 more)
  =========================== */

  it("returns ALL users when no page/limit given (backward compatible)", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeUndefined(); // old behavior
  });

  it("rejects invalid page (?page=0)", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users?page=0&limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("rejects invalid limit (?limit=0)", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users?page=1&limit=0")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("caps limit to max 100 when limit is too large", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users?page=1&limit=999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.limit).toBe(100);
  });

  it("non-admin user cannot access admin list", async () => {
    const { token } = await createUserAndGetToken();

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${token}`);

    expect([401, 403]).toContain(res.status);
  });

  it("admin can create user (multipart/form-data)", async () => {
    const { token } = await createAdminAndGetToken();
    const email = `created${Date.now()}@test.com`;

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "Created User")
      .field("email", email)
      .field("countryCode", "+977")
      .field("phone", "9800000000")
      .field("address", "Kathmandu")
      .field("password", "Password@123!")
      .field("role", "user");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
  });

  it("admin create user fails on duplicate email (409 or 400)", async () => {
    const { token } = await createAdminAndGetToken();
    const email = `dup${Date.now()}@test.com`;

    // create first time
    const res1 = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "Dup User")
      .field("email", email)
      .field("countryCode", "+977")
      .field("phone", "9800000000")
      .field("address", "Kathmandu")
      .field("password", "Password@123!")
      .field("role", "user");

    expect([201, 200]).toContain(res1.status);

    // create second time
    const res2 = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "Dup User 2")
      .field("email", email)
      .field("countryCode", "+977")
      .field("phone", "9800000000")
      .field("address", "Kathmandu")
      .field("password", "Password@123!")
      .field("role", "user");

    expect([400, 409]).toContain(res2.status);
  });

  it("admin can update user (multipart/form-data)", async () => {
    const { token } = await createAdminAndGetToken();
    const email = `upd${Date.now()}@test.com`;

    const created = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "To Update")
      .field("email", email)
      .field("countryCode", "+977")
      .field("phone", "9800000000")
      .field("address", "Kathmandu")
      .field("password", "Password@123!")
      .field("role", "user");

    expect(created.status).toBe(201);

    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/admin/users/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "Updated Name");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe("Updated Name");
  });

  it("admin update rejects invalid id format (400)", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .put(`/api/admin/users/invalid-id`)
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "Won't Work");

    expect(res.status).toBe(400);
  });
});
