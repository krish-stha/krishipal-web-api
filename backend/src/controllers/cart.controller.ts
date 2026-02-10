import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { CartModel } from "../models/cart.model";
import { ProductModel } from "../models/product.model";

function mustUserId(req: AuthRequest) {
  const userId = req.user?.id;
  if (!userId) throw new HttpError(401, "Not authorized");
  return userId;
}

function effectivePrice(p: any): number {
  const d = p?.discountPrice;
  if (d !== null && d !== undefined && Number(d) >= 0) return Number(d);
  return Number(p?.price || 0);
}

const cartPopulate = {
  path: "items.product",
  select: "name slug sku price discountPrice stock images category status deleted_at",
  populate: { path: "category", select: "name slug" },
};

export class CartController {
  // GET /api/cart
  async getMyCart(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);

    const cart = await CartModel.findOne({ user: userId })
      .populate(cartPopulate)
      .lean();

    return res.status(200).json({
      success: true,
      data: cart ?? { user: userId, items: [] },
    });
  }

  // POST /api/cart/items  { productId, qty }
  async add(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);

    const { productId, qty } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, "Invalid productId");
    }

    const addQty = Number(qty ?? 1);
    if (!Number.isInteger(addQty) || addQty <= 0) {
      throw new HttpError(400, "qty must be a positive integer");
    }

    const product = await ProductModel.findOne({
      _id: productId,
      deleted_at: null,
      status: "active",
    }).lean();

    if (!product) throw new HttpError(404, "Product not found");
    if (typeof product.stock === "number" && product.stock < addQty) {
      throw new HttpError(400, "Insufficient stock");
    }

    // ✅ snapshot price at time of add
    const priceSnapshot = effectivePrice(product);

    // 1) If exists -> increment qty (no need to touch priceSnapshot)
    const inc = await CartModel.findOneAndUpdate(
      { user: userId, "items.product": productId },
      { $inc: { "items.$[i].qty": addQty } },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ "i.product": new mongoose.Types.ObjectId(productId) }],
      }
    ).populate(cartPopulate);

    if (inc) return res.status(200).json({ success: true, data: inc });

    // 2) Else push new item (✅ include priceSnapshot!)
    const pushed = await CartModel.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          items: {
            product: productId,
            qty: addQty,
            priceSnapshot,
          },
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate(cartPopulate);

    return res.status(200).json({ success: true, data: pushed });
  }

  // PUT /api/cart/items/:productId  { qty }
  async updateQty(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);

    const { productId } = req.params;
    const { qty } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, "Invalid productId");
    }

    const nextQty = Number(qty);
    if (!Number.isInteger(nextQty) || nextQty < 1) {
      throw new HttpError(400, "qty must be >= 1");
    }

    const product = await ProductModel.findOne({
      _id: productId,
      deleted_at: null,
      status: "active",
    }).lean();

    if (!product) throw new HttpError(404, "Product not found");
    if (typeof product.stock === "number" && product.stock < nextQty) {
      throw new HttpError(400, "Insufficient stock");
    }

    const updated = await CartModel.findOneAndUpdate(
      { user: userId, "items.product": productId },
      { $set: { "items.$[i].qty": nextQty } },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ "i.product": new mongoose.Types.ObjectId(productId) }],
      }
    ).populate(cartPopulate);

    if (!updated) throw new HttpError(404, "Item not found in cart");

    return res.status(200).json({ success: true, data: updated });
  }

  // DELETE /api/cart/items/:productId
  async remove(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new HttpError(400, "Invalid productId");
    }

    const updated = await CartModel.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { new: true, runValidators: true }
    ).populate(cartPopulate);

    return res.status(200).json({
      success: true,
      data: updated ?? { user: userId, items: [] },
    });
  }

  // DELETE /api/cart
  async clear(req: AuthRequest, res: Response) {
    const userId = mustUserId(req);

    const updated = await CartModel.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate(cartPopulate);

    return res.status(200).json({ success: true, data: updated });
  }
}
