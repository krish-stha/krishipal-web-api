import request from "supertest";
import app from "../../app";
import { registerTestUser, loginTestUser } from "../helpers/test-auth";

describe("Auth Integration", () => {

  it("registers new user", async () => {
    const { res } = await registerTestUser();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("fails if duplicate email", async () => {
    const { email } = await registerTestUser();

    const res = await request(app).post("/api/auth/register").send({
      fullName: "Duplicate",
      email,
      countryCode: "+977",
      phone: "9800000000",
      address: "Kathmandu",
      password: "Password@123!"
    });

    expect(res.status).toBe(409);
  });

  it("logs in successfully after register", async () => {
    const { email, password } = await registerTestUser();
    const res = await loginTestUser(email, password);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
  });

  it("fails login with wrong password", async () => {
    const { email } = await registerTestUser();

    const res = await loginTestUser(email, "WrongPass@123");

    expect(res.status).toBe(401);
  });

  it("rejects /me without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns profile with valid token", async () => {
    const { email, password } = await registerTestUser();
    const loginRes = await loginTestUser(email, password);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
  });

});
