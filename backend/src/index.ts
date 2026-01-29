import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/auth.route";
import addressBatchRoutes from "./routes/address_batch_route";
import { errorHandler } from "./middleware/error.middleware";
import adminUserRoutes from "./routes/admin.user.route";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve public folder
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use("/api/auth", authRoutes);
app.use("/api/batches", addressBatchRoutes);


app.use("/api/admin", adminUserRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
