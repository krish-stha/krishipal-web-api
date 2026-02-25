import mongoose from "mongoose";
import { HttpError } from "../errors/http-error";
import { OrderModel } from "../models/order.model";
import { InventoryService } from "./inventory.service";

const inv = new InventoryService();

export class InventoryOrderService {
  /**
   * Deduct stock for a paid order ONCE.
   * Safe if called multiple times: it checks a marker.
   */
  async applyPaidOrderStockOut(orderId: string, actorId?: string | null) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) throw new HttpError(400, "Invalid orderId");

    const order = await OrderModel.findOne({ _id: orderId, deleted_at: null });
    if (!order) throw new HttpError(404, "Order not found");

    if (String(order.paymentStatus).toLowerCase() !== "paid") {
      throw new HttpError(400, "Order is not paid");
    }

    // ✅ idempotency marker (add this field in order model later if you want)
    // For now: use paymentMeta.inventoryDeducted boolean safely.
    const meta: any = (order.paymentMeta ?? {}) as any;
    if (meta.inventoryDeducted === true) return { ok: true, message: "Already deducted" };

    // Deduct each item atomically
    for (const it of order.items || []) {
      await inv.stockOutAtomic({
        productId: String(it.product),
        qty: Number(it.qty),
        type: "ORDER_PAID",
        orderId: String(order._id),
        actorId: actorId ?? null,
        reason: `Order paid: ${String(order._id)}`,
        meta: { sku: it.sku, name: it.name },
      });
    }

    order.paymentMeta = { ...(order.paymentMeta ?? {}), inventoryDeducted: true };
    await order.save();

    return { ok: true, message: "Stock deducted" };
  }
}