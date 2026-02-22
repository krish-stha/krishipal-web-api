import mongoose from "mongoose";
import { HttpError } from "../errors/http-error";
import { ProductModel } from "../models/product.model";
import { InventoryTransactionModel } from "../models/inventory_transaction.model";

export class InventoryService {
  /**
   * Atomic decrease stock. Prevents oversell.
   */
  async stockOutAtomic(params: {
    productId: string;
    qty: number;
    type?: "STOCK_OUT" | "ORDER_PAID";
    orderId?: string | null;
    actorId?: string | null;
    reason?: string;
    meta?: any;
  }) {
    const qty = Number(params.qty);
    if (!Number.isInteger(qty) || qty <= 0) throw new HttpError(400, "qty must be positive integer");

    const productId = new mongoose.Types.ObjectId(params.productId);

    // 1) Read current stock (for ledger)
    const before = await ProductModel.findById(productId).select("stock").lean();
    if (!before) throw new HttpError(404, "Product not found");

    const beforeStock = Number(before.stock ?? 0);
    if (beforeStock < qty) throw new HttpError(400, "Insufficient stock");

    // 2) Atomic decrement (only if stock >= qty)
    const updated = await ProductModel.findOneAndUpdate(
      { _id: productId, deleted_at: null, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    ).select("stock").lean();

    if (!updated) throw new HttpError(400, "Insufficient stock");

    const afterStock = Number(updated.stock ?? 0);

    // 3) Ledger entry
    await InventoryTransactionModel.create({
      product: productId,
      type: params.type ?? "STOCK_OUT",
      qty,
      beforeStock,
      afterStock,
      reason: params.reason ?? "",
      order: params.orderId ? new mongoose.Types.ObjectId(params.orderId) : null,
      actor: params.actorId ? new mongoose.Types.ObjectId(params.actorId) : null,
      meta: params.meta ?? null,
    });

    return { beforeStock, afterStock };
  }

  async stockIn(params: {
    productId: string;
    qty: number;
    actorId?: string | null;
    reason?: string;
    meta?: any;
  }) {
    const qty = Number(params.qty);
    if (!Number.isInteger(qty) || qty <= 0) throw new HttpError(400, "qty must be positive integer");

    const productId = new mongoose.Types.ObjectId(params.productId);

    const before = await ProductModel.findById(productId).select("stock").lean();
    if (!before) throw new HttpError(404, "Product not found");

    const beforeStock = Number(before.stock ?? 0);

    const updated = await ProductModel.findOneAndUpdate(
      { _id: productId, deleted_at: null },
      { $inc: { stock: qty } },
      { new: true }
    ).select("stock").lean();

    if (!updated) throw new HttpError(404, "Product not found");

    const afterStock = Number(updated.stock ?? 0);

    await InventoryTransactionModel.create({
      product: productId,
      type: "STOCK_IN",
      qty,
      beforeStock,
      afterStock,
      reason: params.reason ?? "",
      actor: params.actorId ? new mongoose.Types.ObjectId(params.actorId) : null,
      meta: params.meta ?? null,
    });

    return { beforeStock, afterStock };
  }

  async lowStock(threshold = 5) {
    const n = Math.max(0, Number(threshold));
    const rows = await ProductModel.find({ deleted_at: null, stock: { $lte: n } })
      .select("name slug sku stock price discountPrice images category status")
      .sort({ stock: 1 })
      .populate("category", "name slug")
      .lean();

    return rows;
  }

  async listLogs(params: { page?: number; limit?: number; productId?: string; type?: string }) {
    const page = Math.max(1, Number(params.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit ?? 20)));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (params.productId && mongoose.Types.ObjectId.isValid(params.productId)) {
      filter.product = new mongoose.Types.ObjectId(params.productId);
    }
    if (params.type) filter.type = String(params.type).toUpperCase();

    const [total, data] = await Promise.all([
      InventoryTransactionModel.countDocuments(filter),
      InventoryTransactionModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("product", "name sku slug")
        .lean(),
    ]);

    return { data, meta: { total, page, limit } };
  }
}