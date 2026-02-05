import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route";
import addressBatchRoutes from "./routes/address_batch_route";
import adminUserRoutes from "./routes/admin.user.route";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// ===== Middlewares =====
app.use(cors());
app.use(express.json());

// ===== Static folders =====
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/batches", addressBatchRoutes);
app.use("/api/admin", adminUserRoutes);

// ===== Global Error Handler =====
app.use(errorHandler);

export default app;
