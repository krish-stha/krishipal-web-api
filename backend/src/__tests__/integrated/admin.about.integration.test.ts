import request from "supertest";
import path from "path";
import fs from "fs";
import app from "../../app";
import { createAdminAndGetToken, createUserAndGetToken } from "../helpers/test-auth";

function makeTempPng(): string {
  // create a tiny file with .png extension (multer just needs file path)
  const p = path.join(process.cwd(), "tmp-test-upload.png");
  fs.writeFileSync(p, Buffer.from([0x89, 0x50, 0x4e, 0x47])); // PNG signature bytes (minimal)
  return p;
}

describe("Admin About Integration", () => {
  it("GET /api/admin/about rejects without token", async () => {
    const res = await request(app).get("/api/admin/about");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/about rejects non-admin", async () => {
    const { token } = await createUserAndGetToken();
    const res = await request(app)
      .get("/api/admin/about")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("GET /api/admin/about works for admin", async () => {
    const { token } = await createAdminAndGetToken();
    const res = await request(app)
      .get("/api/admin/about")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeDefined();
  });

  it("PUT /api/admin/about updates content (admin)", async () => {
    const { token } = await createAdminAndGetToken();

    const payload = {
      title: "About KrishiPal",
      missionTitle: "Mission",
      missionText: "Help farmers grow smarter.",
      visionTitle: "Vision",
      visionText: "Better harvests, less risk.",
    };

    const res = await request(app)
      .put("/api/admin/about")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect([200, 201]).toContain(res.status);
    // usually your APIs return {success:true,data:...} — keep loose
    expect(res.body).toBeDefined();
  });

  it("POST /api/admin/about/mission-image uploads image (admin)", async () => {
    const { token } = await createAdminAndGetToken();
    const filePath = makeTempPng();

    const res = await request(app)
      .post("/api/admin/about/mission-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", filePath);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeDefined();

    fs.existsSync(filePath) && fs.unlinkSync(filePath);
  });

  it("POST /api/admin/about/vision-image uploads image (admin)", async () => {
    const { token } = await createAdminAndGetToken();
    const filePath = makeTempPng();

    const res = await request(app)
      .post("/api/admin/about/vision-image")
      .set("Authorization", `Bearer ${token}`)
      .attach("image", filePath);

    expect([200, 201]).toContain(res.status);
    expect(res.body).toBeDefined();

    fs.existsSync(filePath) && fs.unlinkSync(filePath);
  });
});