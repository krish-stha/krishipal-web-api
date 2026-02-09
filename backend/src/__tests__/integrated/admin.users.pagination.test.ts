import request from "supertest";
import app from "../../app";

describe("Admin Users Pagination", () => {
  it("returns paginated users with meta", async () => {
    // TODO: Replace with real admin token from your test helper
    const token = "PUT_VALID_ADMIN_JWT_HERE";

    const res = await request(app)
      .get("/api/admin/users?page=1&limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeLessThanOrEqual(5);

    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
    expect(typeof res.body.meta.total).toBe("number");
    expect(typeof res.body.meta.totalPages).toBe("number");
  });
});
