import { CartModel } from "../models/cart.model";

export class CartRepository {
  getByUserId(userId: string) {
    return CartModel.findOne({ user: userId })
      .populate({
        path: "items.product",
        select: "name slug sku price discountPrice stock images category status deleted_at",
        populate: { path: "category", select: "name slug" },
      })
      .lean();
  }

  createForUser(userId: string) {
    return CartModel.create({ user: userId, items: [] });
  }

  async upsert(userId: string, update: any) {
    return CartModel.findOneAndUpdate({ user: userId }, update, {
      new: true,
      upsert: true,
    })
      .populate({
        path: "items.product",
        select: "name slug sku price discountPrice stock images category status deleted_at",
        populate: { path: "category", select: "name slug" },
      })
      .lean();
  }

  clear(userId: string) {
    return CartModel.findOneAndUpdate({ user: userId }, { $set: { items: [] } }, { new: true })
      .populate({
        path: "items.product",
        select: "name slug sku price discountPrice stock images category status deleted_at",
        populate: { path: "category", select: "name slug" },
      })
      .lean();
  }
}
