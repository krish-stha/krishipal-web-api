import mongoose, { Schema, Document } from "mongoose";

export type InventoryTxnType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "ADJUST"
  | "ORDER_PAID"
  | "ORDER_CANCELLED"
  | "REFUND_RESTOCK";

export interface IInventoryTransaction extends Document {
  product: mongoose.Types.ObjectId;
  type: InventoryTxnType;

  qty: number; // always positive number
  beforeStock: number;
  afterStock: number;

  reason?: string;
  order?: mongoose.Types.ObjectId | null;
  actor?: mongoose.Types.ObjectId | null; // admin/user who did it (optional)

  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    type: {
      type: String,
      enum: ["STOCK_IN", "STOCK_OUT", "ADJUST", "ORDER_PAID", "ORDER_CANCELLED", "REFUND_RESTOCK"],
      required: true,
      index: true,
    },

    qty: { type: Number, required: true, min: 1 },

    beforeStock: { type: Number, required: true, min: 0 },
    afterStock: { type: Number, required: true, min: 0 },

    reason: { type: String, default: "" },

    order: { type: Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },

    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

InventoryTransactionSchema.index({ product: 1, createdAt: -1 });

export const InventoryTransactionModel = mongoose.model<IInventoryTransaction>(
  "InventoryTransaction",
  InventoryTransactionSchema
);