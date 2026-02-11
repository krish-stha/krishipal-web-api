import mongoose, { Schema } from "mongoose";

const CartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1, default: 1 },

    // ✅ allow old carts (where priceSnapshot doesn't exist)
    priceSnapshot: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CartModel = mongoose.model("Cart", CartSchema);
