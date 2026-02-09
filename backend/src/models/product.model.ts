import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  stock: number;
  images: string[];
  category: mongoose.Types.ObjectId;
  status: "active" | "draft";
  deleted_at?: Date | null;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },

    sku: { type: String, required: true, unique: true, index: true, trim: true },

    description: { type: String, default: "" },

    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null, min: 0 },

    stock: { type: Number, required: true, min: 0, default: 0 },

    images: { type: [String], default: [] },

    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },

    status: { type: String, enum: ["active", "draft"], default: "active" },

    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);
