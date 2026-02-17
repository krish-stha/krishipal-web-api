import mongoose, { Schema, Document } from "mongoose";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "COD";
export type PaymentStatus = "unpaid" | "initiated" | "paid" | "failed";
export type PaymentGateway = "COD" | "KHALTI" | "ESEWA";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  sku: string;
  image?: string | null;
  qty: number;
  priceSnapshot: number;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;

  items: IOrderItem[];

  subtotal: number;
  shippingFee: number;
  total: number;

  status: OrderStatus;
  address: string;

  // existing
  paymentMethod: PaymentMethod;

  // cancel fields
  cancelled_at?: Date | null;
  cancelled_by?: mongoose.Types.ObjectId | null;
  cancel_reason?: string | null;

  // ✅ payment tracking (NEW)
  paymentStatus: PaymentStatus;
  paidAt?: Date | null;

  paymentGateway?: PaymentGateway;
  paymentRef?: string | null;
  paymentMeta?: any;

  deleted_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },

    // snapshot fields
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String, default: null },

    qty: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    items: { type: [OrderItemSchema], default: [] },

    subtotal: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },

    address: { type: String, required: true },

    // existing
    paymentMethod: { type: String, enum: ["COD", "KHALTI", "ESEWA"], default: "COD" },


    // cancel
    cancelled_at: { type: Date, default: null },
    cancelled_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    cancel_reason: { type: String, default: null },

    // ✅ payment tracking (NEW)
    paymentStatus: {
      type: String,
      enum: ["unpaid", "initiated", "paid", "failed"],
      default: "unpaid",
      index: true,
    },
    paidAt: { type: Date, default: null },

    paymentGateway: {
      type: String,
      enum: ["COD", "KHALTI", "ESEWA"],
      default: "COD",
    },
    paymentRef: { type: String, default: null },
    paymentMeta: { type: Schema.Types.Mixed, default: null },

    deleted_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);
