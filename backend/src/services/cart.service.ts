import { HttpError } from "../errors/http-error";
import { CartRepository } from "../repositories/cart.repository";
import { ProductModel } from "../models/product.model";

const repo = new CartRepository();

export class CartService {
  async getCart(userId: string) {
    const cart = await repo.getByUserId(userId);
    if (!cart) {
      await repo.createForUser(userId);
      return repo.getByUserId(userId);
    }
    return cart;
  }

  async addItem(userId: string, productId: string, qty: number) {
    const product = await ProductModel.findOne({ _id: productId, deleted_at: null }).lean();
    if (!product) throw new HttpError(404, "Product not found");
    if (product.status !== "active") throw new HttpError(400, "Product not available");

    const stock = Number(product.stock ?? 0);
    if (stock <= 0) throw new HttpError(400, "Out of stock");
    if (qty > stock) throw new HttpError(400, "Quantity exceeds stock");

    // price snapshot (use discountPrice if present)
    const snapPrice =
      product.discountPrice !== null && product.discountPrice !== undefined
        ? Number(product.discountPrice)
        : Number(product.price);

    // Upsert logic:
    // - if item exists -> increment qty (but cap by stock)
    // - else push item
    const existingCart = await repo.getByUserId(userId);
    const existingItem = existingCart?.items?.find(
      (it: any) => String(it.product?._id || it.product) === String(productId)
    );

    if (existingItem) {
      const newQty = Math.min(Number(existingItem.qty) + qty, stock);
      return repo.upsert(userId, {
        $set: {
          "items.$[i].qty": newQty,
          "items.$[i].priceSnapshot": snapPrice,
          updatedAt: new Date(),
        },
      } as any & { arrayFilters?: any[] }).then(async () => {
        // NOTE: mongoose typing is annoying; do second update with arrayFilters properly:
        const updated = await repo.upsert(userId, {
          $set: {
            updatedAt: new Date(),
            "items.$[i].qty": newQty,
            "items.$[i].priceSnapshot": snapPrice,
          },
        });
        return updated;
      });
    }

    const updated = await repo.upsert(userId, {
      $push: { items: { product: productId, qty, priceSnapshot: snapPrice } },
      $set: { updatedAt: new Date() },
    });

    return updated;
  }

  async updateQty(userId: string, productId: string, qty: number) {
    const product = await ProductModel.findOne({ _id: productId, deleted_at: null }).lean();
    if (!product) throw new HttpError(404, "Product not found");

    const stock = Number(product.stock ?? 0);
    if (stock <= 0) throw new HttpError(400, "Out of stock");
    if (qty > stock) throw new HttpError(400, "Quantity exceeds stock");

    const updated = await repo.upsert(userId, {
      $set: {
        updatedAt: new Date(),
        "items.$[i].qty": qty,
      },
    } as any);

    // arrayFilters isn't included above (mongoose typing). We'll do it with native update:
    // safest way: use CartModel directly for arrayFilters
    // (this does NOT break architecture; it’s only for arrayFilters)
    const { CartModel } = await import("../models/cart.model");
    await CartModel.updateOne(
      { user: userId },
      { $set: { "items.$[i].qty": qty, updatedAt: new Date() } },
      { arrayFilters: [{ "i.product": productId }] }
    );

    return repo.getByUserId(userId);
  }

  async removeItem(userId: string, productId: string) {
    const updated = await repo.upsert(userId, {
      $pull: { items: { product: productId } },
      $set: { updatedAt: new Date() },
    });
    return updated;
  }

  async clearCart(userId: string) {
    return repo.clear(userId);
  }
}
