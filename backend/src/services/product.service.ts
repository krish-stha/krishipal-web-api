import { HttpError } from "../errors/http-error";
import { ProductRepository } from "../repositories/product.repository";
import { CategoryModel } from "../models/category.model";
import { ProductModel } from "../models/product.model";
import { toSlug } from "../utils/slug";
import type { SortOrder } from "mongoose";

const repo = new ProductRepository();

function normalizeSku(sku: string) {
  return sku.trim().toUpperCase();
}

export class ProductService {
  async create(payload: any, imageFiles: Express.Multer.File[]) {
    const sku = normalizeSku(payload.sku);

    const skuExists = await repo.findBySku(sku);
    if (skuExists) throw new HttpError(409, "SKU already exists");

    const cat = await CategoryModel.findOne({
      _id: payload.categoryId,
      deleted_at: null,
    });
    if (!cat) throw new HttpError(400, "Invalid category");

    const slugBase = toSlug(payload.name);
    let slug = slugBase;
    let i = 1;
    while (await ProductModel.findOne({ slug })) {
      slug = `${slugBase}-${i++}`;
    }

    const images = (imageFiles || []).map((f) => f.filename);

    return repo.create({
      name: payload.name,
      slug,
      sku,
      description: payload.description ?? "",
      price: payload.price,
      discountPrice: payload.discountPrice ?? null,
      stock: payload.stock,
      images,
      category: payload.categoryId,
      status: payload.status ?? "active",
      deleted_at: null,
    });
  }

  listAdmin() {
    return repo.listAdmin();
  }

  getById(id: string) {
    return repo.findById(id);
  }

  async update(id: string, payload: any, imageFiles: Express.Multer.File[]) {
    const existing = await ProductModel.findOne({ _id: id, deleted_at: null });
    if (!existing) throw new HttpError(404, "Product not found");

    const data: any = { ...payload };

    if (payload.sku) {
      const sku = normalizeSku(payload.sku);
      const skuExists = await ProductModel.findOne({
        sku,
        _id: { $ne: id },
        deleted_at: null,
      });
      if (skuExists) throw new HttpError(409, "SKU already exists");
      data.sku = sku;
    }

    if (payload.name) {
      const slugBase = toSlug(payload.name);
      let slug = slugBase;
      let i = 1;
      while (true) {
        const found = await ProductModel.findOne({ slug });
        if (!found || String(found._id) === String(id)) break;
        slug = `${slugBase}-${i++}`;
      }
      data.slug = slug;
    }

    if (payload.categoryId) {
      const cat = await CategoryModel.findOne({
        _id: payload.categoryId,
        deleted_at: null,
      });
      if (!cat) throw new HttpError(400, "Invalid category");
      data.category = payload.categoryId;
      delete data.categoryId;
    }

    // Images: if new images uploaded, APPEND (gallery behavior)
    if (imageFiles && imageFiles.length > 0) {
      const newOnes = imageFiles.map((f) => f.filename);
      data.images = [...((existing as any).images || []), ...newOnes];
    }

    // stock cannot be negative
    if (data.stock !== undefined && Number(data.stock) < 0) {
      throw new HttpError(400, "Stock cannot be negative");
    }

    const updated = await repo.updateById(id, data);
    return updated;
  }

  async softDelete(id: string) {
    const updated = await repo.softDeleteById(id);
    if (!updated) throw new HttpError(404, "Product not found");
    return updated;
  }

  async hardDelete(id: string) {
    const deleted = await repo.hardDeleteById(id);
    if (!deleted) throw new HttpError(404, "Product not found");
    return deleted;
  }

  // PUBLIC
  async listPublic(q: any) {
    // categorySlug -> categoryId
    if (q.categorySlug) {
      const cat = await CategoryModel.findOne({
        slug: q.categorySlug,
        deleted_at: null,
      }).lean();

      if (!cat) {
        return {
          data: [],
          meta: {
            total: 0,
            page: 1,
            limit: Number(q.limit || 12),
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      const page = Number(q.page || 1);
      const limit = Number(q.limit || 12);
      const skip = (page - 1) * limit;

      const search = q.search ? new RegExp(String(q.search), "i") : null;

      const filter: any = {
        deleted_at: null,
        status: "active",
        category: cat._id,
      };

      if (search) filter.$or = [{ name: search }, { sku: search }];

      // ✅ TS-safe sort object
      const sortObj: Record<string, SortOrder> =
        q.sort === "price_asc"
          ? { price: 1 }
          : q.sort === "price_desc"
          ? { price: -1 }
          : { createdAt: -1 };

      const [total, data] = await Promise.all([
        ProductModel.countDocuments(filter),
        ProductModel.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .populate("category", "name slug")
          .lean(),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    return repo.listPublic(q);
  }

  getPublicBySlug(slug: string) {
    return repo.findBySlug(slug);
  }
}
