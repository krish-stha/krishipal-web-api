import mongoose, { Schema } from "mongoose";

export type PaymentLogAction =
  | "INITIATE"
  | "VERIFY"
  | "REFUND_REQUEST"
  | "REFUND_APPROVE"
  | "REFUND_REJECT";

export type PaymentLogStatus = "success" | "failed" | "pending";

export interface IPaymentLog {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;

  gateway: "KHALTI" | "COD" | "ESEWA";
  action: PaymentLogAction;
  status: PaymentLogStatus;

  // store paisa for strict accuracy with gateways
  amountPaisa: number;

  ref?: string | null; // pidx / transaction_id
  message?: string | null;
  payload?: any;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentLogSchema = new Schema<IPaymentLog>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    gateway: { type: String, enum: ["KHALTI", "COD", "ESEWA"], required: true },
    action: {
      type: String,
      enum: ["INITIATE", "VERIFY", "REFUND_REQUEST", "REFUND_APPROVE", "REFUND_REJECT"],
      required: true,
      index: true,
    },
    status: { type: String, enum: ["success", "failed", "pending"], default: "pending", index: true },

    amountPaisa: { type: Number, default: 0 },
    ref: { type: String, default: null },
    message: { type: String, default: null },
    payload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

export const PaymentLogModel = mongoose.model<IPaymentLog>("PaymentLog", PaymentLogSchema);
