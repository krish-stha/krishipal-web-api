import mongoose from "mongoose";
import { connectDatabase } from "../database/mongodb";

// Increase timeout for DB + supertest integration tests
jest.setTimeout(30000);

// ✅ Connect only once per Jest worker process
beforeAll(async () => {
  const g = globalThis as any;
  if (!g.__MONGO_CONNECTED__) {
    await connectDatabase();
    g.__MONGO_CONNECTED__ = true;
  }
});

// ✅ Close only once at the end of the worker process
afterAll(async () => {
  const g = globalThis as any;
  if (!g.__MONGO_CLOSED__ && mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    g.__MONGO_CLOSED__ = true;
  }
});