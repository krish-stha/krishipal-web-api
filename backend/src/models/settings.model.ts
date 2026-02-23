import mongoose, { Schema } from "mongoose";

// models/settings.model.ts (or wherever yours is)

export interface ISettings {
  storeName: string;
  storeAddress: string;
  storeEmail: string;

  storePhone?: string; 

  shippingFeeDefault: number;
  freeShippingThreshold?: number | null;

  lowStockThreshold: number;
  storeLogo: string;

  payments: {
    COD: boolean;
    KHALTI: boolean;
    ESEWA: boolean;
  };

  updatedAt: Date;
  createdAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    storeName: { type: String, default: "KrishiPal" },
    storeAddress: { type: String, default: "Kathmandu, Nepal" },
    storeEmail: { type: String, default: "support@krishipal.com" },

    storePhone: { type: String, default: "" }, // ✅ ADD

    shippingFeeDefault: { type: Number, default: 0, min: 0 },
    freeShippingThreshold: { type: Number, default: null, min: 0 },

    lowStockThreshold: { type: Number, default: 5, min: 1 },
    storeLogo: { type: String, default: "" }, // filename or full URL

    payments: {
      COD: { type: Boolean, default: true },
      KHALTI: { type: Boolean, default: true },
      ESEWA: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<ISettings>("Settings", SettingsSchema);