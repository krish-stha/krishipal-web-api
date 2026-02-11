import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { CartModel } from "../models/cart.model";

function mustAdmin(req: AuthRequest) {
  if (req.user?.role !== "admin") throw new HttpError(403, "Admin only");
}

// subtotal helper (uses priceSnapshot if present, else product price)
function calcSubtotal(cart: any) {
  const items = cart?.items || [];
  return items.reduce((sum: number, it: any) => {
    const qty = Number(it.qty ?? 0);

    const snap = Number(it.priceSnapshot ?? 0);
    const p = it.product || {};
    const price =
      snap > 0
        ? snap
        : p.discountPrice !== null && p.discountPrice !== undefined
        ? Number(p.discountPrice)
        : Number(p.price ?? 0);

    return sum + qty * price;
  }, 0);
}

export class AdminCartController {
  // GET /api/admin/carts?page=&limit=&search=
  async list(req: AuthRequest, res: Response) {
    mustAdmin(req);

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const search = String(req.query.search ?? "").trim().toLowerCase();

    // base query
    const query: any = {};

    // fetch carts with user + items
    const all = await CartModel.find(query)
      .populate({ path: "user", select: "fullName email" }) // ✅ IMPORTANT
      .populate({ path: "items.product", select: "name price discountPrice" })
      .sort({ updatedAt: -1 })
      .lean();

    // filter in JS (simple and safe)
    let filtered = all;
    if (search) {
      filtered = all.filter((c: any) => {
        const n = String(c.user?.fullName ?? "").toLowerCase();
        const e = String(c.user?.email ?? "").toLowerCase();
        return n.includes(search) || e.includes(search);
      });
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    // shape output exactly for frontend table
    const rows = paged.map((c: any) => {
      const items = c.items || [];
      const itemsCount = items.reduce((s: number, it: any) => s + Number(it.qty ?? 0), 0);

      const itemNames = items
        .map((it: any) => it?.product?.name)
        .filter(Boolean);

      return {
        _id: c._id,

        // ✅ these must match your frontend usage
        userName: c.user?.fullName || "-",
        userEmail: c.user?.email || "-",

        itemsCount,
        itemNames,
        subtotal: calcSubtotal(c),

        updatedAt: c.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: rows,
      meta: { total, page, limit },
    });
  }

  // GET /api/admin/carts/:id
  async getById(req: AuthRequest, res: Response) {
    mustAdmin(req);

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid cart id");

    const cart = await CartModel.findById(id)
      .populate({ path: "user", select: "fullName email role" }) // ✅ fullName
      .populate({
        path: "items.product",
        select: "name slug sku price discountPrice stock images category",
        populate: { path: "category", select: "name slug" },
      })
      .lean();

    if (!cart) throw new HttpError(404, "Cart not found");

    return res.status(200).json({
      success: true,
      data: {
        ...cart,
        subtotal: calcSubtotal(cart),
      },
    });
  }

  // PUT /api/admin/carts/:id/items/:productId  { qty }
  async setItemQty(req: AuthRequest, res: Response) {
    mustAdmin(req);

    const { id, productId } = req.params;
    const { qty } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid cart id");
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new HttpError(400, "Invalid productId");

    const nextQty = Number(qty);
    if (!Number.isInteger(nextQty) || nextQty < 1) throw new HttpError(400, "qty must be >= 1");

    const updated = await CartModel.findOneAndUpdate(
      { _id: id, "items.product": productId },
      { $set: { "items.$[i].qty": nextQty } },
      {
        new: true,
        arrayFilters: [{ "i.product": new mongoose.Types.ObjectId(productId) }],
      }
    )
      .populate({ path: "user", select: "fullName email role" })
      .populate({
        path: "items.product",
        select: "name slug sku price discountPrice stock images category",
        populate: { path: "category", select: "name slug" },
      })
      .lean();

    if (!updated) throw new HttpError(404, "Cart or item not found");

    return res.status(200).json({
      success: true,
      data: {
        ...updated,
        subtotal: calcSubtotal(updated),
      },
    });
  }

  // DELETE /api/admin/carts/:id/items/:productId
  async removeItem(req: AuthRequest, res: Response) {
    mustAdmin(req);

    const { id, productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid cart id");
    if (!mongoose.Types.ObjectId.isValid(productId)) throw new HttpError(400, "Invalid productId");

    const updated = await CartModel.findByIdAndUpdate(
      id,
      { $pull: { items: { product: productId } } },
      { new: true }
    )
      .populate({ path: "user", select: "fullName email role" })
      .populate({
        path: "items.product",
        select: "name slug sku price discountPrice stock images category",
        populate: { path: "category", select: "name slug" },
      })
      .lean();

    if (!updated) throw new HttpError(404, "Cart not found");

    return res.status(200).json({
      success: true,
      data: {
        ...updated,
        subtotal: calcSubtotal(updated),
      },
    });
  }

  // DELETE /api/admin/carts/:id/clear
  async clear(req: AuthRequest, res: Response) {
    mustAdmin(req);

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid cart id");

    const updated = await CartModel.findByIdAndUpdate(id, { $set: { items: [] } }, { new: true })
      .populate({ path: "user", select: "fullName email role" })
      .lean();

    if (!updated) throw new HttpError(404, "Cart not found");

    return res.status(200).json({ success: true, data: updated });
  }

  // DELETE /api/admin/carts/:id  (delete cart document)
  async deleteCart(req: AuthRequest, res: Response) {
    mustAdmin(req);

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid cart id");

    const deleted = await CartModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new HttpError(404, "Cart not found");

    return res.status(200).json({ success: true, data: { deleted: true } });
  }
}
