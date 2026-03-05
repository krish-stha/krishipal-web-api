import request from "supertest";
import app from "../../app";
import { createAdminAndGetToken } from "../helpers/test-auth";

describe("Admin Settings Integration", () => {
  it("GET /api/admin/settings works for admin", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .get("/api/admin/settings")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(res.status);
  });

  it("PUT /api/admin/settings updates settings (admin)", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .put("/api/admin/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        storeName: "KrishiPal",
        storeAddress: "Kathmandu",
        storeEmail: "store@test.com",
        storePhone: "+9779800000000",
        lowStockThreshold: 5,
        payments: { COD: true, KHALTI: true, ESEWA: true },
      });

    expect([200, 201]).toContain(res.status);
  });

  it("POST /api/admin/settings/logo uploads logo (admin)", async () => {
    const { token } = await createAdminAndGetToken();

    const res = await request(app)
      .post("/api/admin/settings/logo")
      .set("Authorization", `Bearer ${token}`)
      .attach("logo", Buffer.from("fake-logo"), {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect([200, 201]).toContain(res.status);
  });
});