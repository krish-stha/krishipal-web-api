// src/__tests__/integrated/auth.controller.integration.test.ts
import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { registerTestUser, loginTestUser } from "../helpers/test-auth";

jest.mock("../../services/mail.service", () => ({
  sendResetEmail: jest.fn(async () => true),
}));

function expectHasAnyErrorBody(res: request.Response) {
  // Some of your 400s come from controller zod -> { success:false, errors: ... }
  // Some come from middleware/errorHandler -> { message: ... } or similar
  expect(res.body).toBeDefined();
  expect(typeof res.body).toBe("object");

  const hasZod = res.body?.errors !== undefined;
  const hasMsg = typeof res.body?.message === "string" && res.body.message.length > 0;
  const hasErr = typeof res.body?.error === "string" && res.body.error.length > 0;

  expect(hasZod || hasMsg || hasErr).toBe(true);
}

describe("Auth Controller Integration", () => {
  it("POST /api/auth/register returns 400 for invalid body", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "nope" });

    expect(res.status).toBe(400);

    // ✅ don't assume success:false always (depends on your error handler)
    expectHasAnyErrorBody(res);

    // Optional: if your controller handled it, success may exist:
    if (typeof res.body?.success !== "undefined") {
      expect(res.body.success).toBe(false);
    }
  });

  it("POST /api/auth/register success", async () => {
    const email = `ctrl-${Date.now()}@test.com`.toLowerCase();

    const res = await request(app).post("/api/auth/register").send({
      fullName: "Controller User",
      email,
      countryCode: "+977",
      phone: "9800000000",
      address: "Kathmandu",
      password: "Password@123!",
    });

    expect([200, 201]).toContain(res.status);
    expect(res.body.success).toBe(true);
    expect(String(res.body.data?.email || "").toLowerCase()).toBe(email);
  });

  it("POST /api/auth/login returns 400 for invalid body", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nope" });

    expect(res.status).toBe(400);
    expectHasAnyErrorBody(res);

    if (typeof res.body?.success !== "undefined") {
      expect(res.body.success).toBe(false);
    }
  });

  it("POST /api/auth/login success after register", async () => {
    const { email, password } = await registerTestUser();
    const res = await loginTestUser(email, password);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  it("GET /api/auth/me rejects without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me returns profile with valid token", async () => {
    const { email, password } = await registerTestUser();
    const loginRes = await loginTestUser(email, password);
    const token = loginRes.body.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(String(res.body.data?.email || "").toLowerCase()).toBe(email);
  });

  it("POST /api/auth/forgot-password returns 400 for invalid body", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "nope" });

    expect(res.status).toBe(400);
    expectHasAnyErrorBody(res);

    if (typeof res.body?.success !== "undefined") {
      expect(res.body.success).toBe(false);
    }
  });

  it("POST /api/auth/forgot-password returns 200 even when email not found", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: `notfound-${Date.now()}@test.com` });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
  });

  it("POST /api/auth/forgot-password stores token hash when email exists", async () => {
    const { email } = await registerTestUser();

    const res = await request(app).post("/api/auth/forgot-password").send({ email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await UserModel.findOne({ email }).lean();
    expect(user).toBeTruthy();
    expect((user as any).reset_password_token).toBeTruthy();
    expect((user as any).reset_password_expires_at).toBeTruthy();
  });

  it("POST /api/auth/reset-password returns 400 for invalid body", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "short", password: "123" });

    expect(res.status).toBe(400);

    // ✅ same reason: may not be { success:false }
    expectHasAnyErrorBody(res);

    if (typeof res.body?.success !== "undefined") {
      expect(res.body.success).toBe(false);
    }
  });

  it("POST /api/auth/reset-password works end-to-end (manual token set)", async () => {
    const { email } = await registerTestUser();

    const fp = await request(app).post("/api/auth/forgot-password").send({ email });
    expect(fp.status).toBe(200);

    const rawToken = "test-reset-token-1234567890abcdef";
    const crypto = await import("crypto");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await UserModel.updateOne(
      { email },
      {
        $set: {
          reset_password_token: tokenHash,
          reset_password_expires_at: new Date(Date.now() + 1000 * 60 * 15),
        },
      }
    );

    const rp = await request(app).post("/api/auth/reset-password").send({
      token: rawToken,
      password: "NewPass@123!",
    });

    expect(rp.status).toBe(200);
    expect(rp.body.success).toBe(true);

    const user2 = await UserModel.findOne({ email }).lean();
    expect((user2 as any).reset_password_token).toBe(null);
    expect((user2 as any).reset_password_expires_at).toBe(null);
  });
});