import { ProductModel } from "../models/product.model";
import type { SortOrder } from "mongoose";

export class ProductRepository {
  create(data: any) {
    return ProductModel.create(data);
  }

  findBySlug(slug: string) {
    return ProductModel.findOne({ slug, deleted_at: null })
      .populate("category", "name slug")
      .lean();
  }

  findById(id: string) {
    return ProductModel.findOne({ _id: id, deleted_at: null })
      .populate("category", "name slug")
      .lean();
  }

  findBySku(sku: string) {
    return ProductModel.findOne({ sku, deleted_at: null });
  }

  listAdmin(filter: any = {}) {
    return ProductModel.find({ deleted_at: null, ...filter })
      .sort({ createdAt: -1 })
      .populate("category", "name slug")
      .lean();
  }

  updateById(id: string, data: any) {
    return ProductModel.findOneAndUpdate(
      { _id: id, deleted_at: null },
      data,
      { new: true }
    )
      .populate("category", "name slug")
      .lean();
  }

  softDeleteById(id: string) {
    return ProductModel.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { deleted_at: new Date(), status: "draft" },
      { new: true }
    ).lean();
  }

  hardDeleteById(id: string) {
    return ProductModel.findByIdAndDelete(id).lean();
  }

  async listPublic(query: any) {
    const {
      page = 1,
      limit = 12,
      search,
      categorySlug,
      sort = "newest",
    } = query;

    const filter: any = { deleted_at: null, status: "active" };

    if (search) {
      filter.$or = [
        { name: new RegExp(String(search), "i") },
        { sku: new RegExp(String(search), "i") },
      ];
    }

    // categorySlug filter is handled in service (needs category lookup)

    // ✅ TS-safe sort object
    const sortObj: Record<string, SortOrder> =
      sort === "price_asc"
        ? { price: 1 }
        : sort === "price_desc"
        ? { price: -1 }
        : { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      ProductModel.countDocuments(filter),
      ProductModel.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .populate("category", "name slug")
        .lean(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / Number(limit)));

    return {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1,
      },
    };
  }
}
