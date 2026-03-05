import request from "supertest";
import crypto from "crypto";
import app from "../../app";
import { UserModel } from "../../models/user.model";

const DEFAULT_PASSWORD = "Password@123!";

type RegisterOverrides = Partial<{
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  address: string;
  password: string;
  role: string;
}>;

function uniqueEmail(prefix = "user") {
  const rand = crypto.randomBytes(6).toString("hex");
  return `${prefix}-${Date.now()}-${rand}@test.com`.toLowerCase();
}

export async function registerTestUser(overrides: RegisterOverrides = {}) {
  const email = String(overrides.email ?? uniqueEmail("user")).toLowerCase();

  // Build payload in a type-safe way (no TS complaining)
  const payload = {
    fullName: overrides.fullName ?? "Test User",
    email,
    countryCode: overrides.countryCode ?? "+977",
    phone: overrides.phone ?? "9800000000",
    address: overrides.address ?? "Kathmandu",
    password: overrides.password ?? DEFAULT_PASSWORD,
  };

  const res = await request(app).post("/api/auth/register").send(payload);

  if (res.status !== 201) {
    throw new Error(`Register failed (${res.status}): ${JSON.stringify(res.body)}`);
  }

  return { email, password: payload.password, res };
}

export async function loginTestUser(email: string, password: string) {
  return request(app).post("/api/auth/login").send({ email, password });
}

export async function createUserAndGetToken() {
  const { email, password } = await registerTestUser();
  const loginRes = await loginTestUser(email, password);

  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error(
      `User login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`
    );
  }

  return { token: loginRes.body.token as string, email };
}

export async function createAdminAndGetToken() {
  const { email, password } = await registerTestUser();

  await UserModel.updateOne({ email }, { $set: { role: "admin" } });

  const loginRes = await loginTestUser(email, password);

  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error(
      `Admin login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`
    );
  }

  return { token: loginRes.body.token as string, email };
}