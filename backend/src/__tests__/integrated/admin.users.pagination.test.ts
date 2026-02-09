import request from "supertest";
import app from "../../app";
import { createAdminAndGetToken } from "../helpers/test-auth";

describe("Admin Users Pagination", () => {

  it("returns paginated users with meta", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users?page=1&limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
  });

  it("returns correct totalPages", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users?page=1&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(typeof res.body.meta.totalPages).toBe("number");
  });

  it("limit works correctly", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/users?page=1&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data.length).toBeLessThanOrEqual(1);
  });

});
