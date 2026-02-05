import mongoose from 'mongoose';
import { connectDatabase } from '../database/mongodb';

// Increase timeout for DB + supertest integration tests
jest.setTimeout(30000);

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await mongoose.connection.close();
});
