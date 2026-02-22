import mongoose, { Schema } from "mongoose";

export type RefundStatus = "requested" | "approved" | "rejected" | "processed";

export interface IRefundRequest {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;

  // paisa
  amountPaisa: number;
  reason?: string | null;

  status: RefundStatus;
  adminNote?: string | null;

  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;

  processedAt?: Date | null; // when actually processed (manual in Khalti dashboard)
  createdAt: Date;
  updatedAt: Date;
}

const RefundRequestSchema = new Schema<IRefundRequest>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    amountPaisa: { type: Number, required: true, min: 1 },
    reason: { type: String, default: null },

    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "processed"],
      default: "requested",
      index: true,
    },
    adminNote: { type: String, default: null },

    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },

    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const RefundRequestModel = mongoose.model<IRefundRequest>("RefundRequest", RefundRequestSchema);
