import { SettingsModel } from "../models/settings.model";
import { HttpError } from "../errors/http-error";

export class SettingsService {
  async getOrCreate() {
    let s = await SettingsModel.findOne({}).lean();
    if (!s) s = (await SettingsModel.create({})).toObject();
    return s;
  }

  async update(payload: any) {
    // basic validation
    const data: any = {};

    if (payload.storeName !== undefined) data.storeName = String(payload.storeName || "").trim();
    if (payload.storeAddress !== undefined) data.storeAddress = String(payload.storeAddress || "").trim();
    if (payload.storeEmail !== undefined) data.storeEmail = String(payload.storeEmail || "").trim();

    if (payload.shippingFeeDefault !== undefined) {
      const v = Number(payload.shippingFeeDefault);
      if (!Number.isFinite(v) || v < 0) throw new HttpError(400, "Invalid shippingFeeDefault");
      data.shippingFeeDefault = v;
    }

    if (payload.freeShippingThreshold !== undefined) {
      if (payload.freeShippingThreshold === null || payload.freeShippingThreshold === "") {
        data.freeShippingThreshold = null;
      } else {
        const v = Number(payload.freeShippingThreshold);
        if (!Number.isFinite(v) || v < 0) throw new HttpError(400, "Invalid freeShippingThreshold");
        data.freeShippingThreshold = v;
      }
    }

    if (payload.lowStockThreshold !== undefined) {
      const v = Number(payload.lowStockThreshold);
      if (!Number.isFinite(v) || v < 1) throw new HttpError(400, "Invalid lowStockThreshold");
      data.lowStockThreshold = v;
    }

    if (payload.payments !== undefined) {
      data.payments = {
        COD: Boolean(payload.payments?.COD),
        KHALTI: Boolean(payload.payments?.KHALTI),
        ESEWA: Boolean(payload.payments?.ESEWA),
      };
    }

    const existing = await SettingsModel.findOne({});
    if (!existing) {
      const created = await SettingsModel.create(data);
      return created.toObject();
    }

    const updated = await SettingsModel.findByIdAndUpdate(
      existing._id,
      { $set: data },
      { new: true }
    ).lean();

    return updated;
  }
}