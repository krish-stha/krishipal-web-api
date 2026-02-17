import mongoose, { Schema, Document } from "mongoose";

export type RefundStatus = "requested" | "approved" | "rejected" | "processed";

export interface IRefund extends Document {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  amount: number; // in paisa
  reason?: string | null;
  status: RefundStatus;
  adminNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    reason: { type: String, default: null },
    status: { type: String, enum: ["requested", "approved", "rejected", "processed"], default: "requested", index: true },
    adminNote: { type: String, default: null },
  },
  { timestamps: true }
);

export const RefundModel = mongoose.model<IRefund>("Refund", RefundSchema);
