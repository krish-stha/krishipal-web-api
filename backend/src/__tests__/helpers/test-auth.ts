import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

const DEFAULT_PASSWORD = "Password@123!"; // keep exactly same everywhere

export async function registerTestUser(overrides?: Partial<any>) {
  const email = overrides?.email ?? `user${Date.now()}@test.com`;

  const payload = {
    fullName: "Test User",
    email,
    countryCode: "+977",
    phone: "9800000000",
    address: "Kathmandu",
    password: overrides?.password ?? DEFAULT_PASSWORD,
    ...overrides,
  };

  const res = await request(app).post("/api/auth/register").send(payload);

  if (res.status !== 201) {
    throw new Error(
      `Register failed (${res.status}): ${JSON.stringify(res.body)}`
    );
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

  // promote to admin
  await UserModel.updateOne({ email }, { $set: { role: "admin" } });

  const loginRes = await loginTestUser(email, password);

  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error(
      `Admin login failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`
    );
  }

  return { token: loginRes.body.token as string, email };
}
