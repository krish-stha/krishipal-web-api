import request from "supertest";
import app from "../../app";
import { createAdminAndGetToken } from "../helpers/test-auth";

describe("Admin Dashboard Integration", () => {
  it("GET /api/admin/dashboard/summary requires admin", async () => {
    const res = await request(app).get("/api/admin/dashboard/summary");
    expect([401, 403]).toContain(res.status);
  });

  it("GET /api/admin/dashboard/summary works for admin", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeDefined();
  });
});