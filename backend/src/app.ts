import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route";
import addressBatchRoutes from "./routes/address_batch_route";
import adminUserRoutes from "./routes/admin.user.route";
import { errorHandler } from "./middleware/error.middleware";

// ✅ add these
import adminCategoryRoutes from "./routes/admin.category.route";
import adminProductRoutes from "./routes/admin.product.route";
import publicProductRoutes from "./routes/public.product.route";
import cartRoutes from "./routes/cart.route";

const app = express();

app.use(cors());
app.use(express.json());

// Static
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/batches", addressBatchRoutes);
app.use("/api/admin", adminUserRoutes);

// ✅ ADD (no breaking)
app.use("/api/admin", adminCategoryRoutes);
app.use("/api/admin", adminProductRoutes);
app.use("/api", publicProductRoutes);
app.use("/api/cart", cartRoutes);

app.use(errorHandler);

export default app;
