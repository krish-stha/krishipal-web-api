import { CartModel } from "../models/cart.model";

const populateCart = {
  path: "items.product",
  select: "name slug sku price discountPrice stock images category status deleted_at",
  populate: { path: "category", select: "name slug" },
};

export class CartRepository {
  getByUserId(userId: string) {
    return CartModel.findOne({ user: userId })
      .populate(populateCart)
      .lean();
  }

  createForUser(userId: string) {
    return CartModel.create({ user: userId, items: [] });
  }

  upsert(userId: string, update: any) {
    return CartModel.findOneAndUpdate({ user: userId }, update, {
      new: true,
      upsert: true,
      runValidators: true,        // ✅ IMPORTANT
      setDefaultsOnInsert: true,  // ✅ IMPORTANT
    })
      .populate(populateCart)
      .lean();
  }

  clear(userId: string) {
    return CartModel.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true, runValidators: true }
    )
      .populate(populateCart)
      .lean();
  }
}
