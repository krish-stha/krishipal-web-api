import { CategoryModel } from "../models/category.model";

export class CategoryRepository {
  create(data: any) {
    return CategoryModel.create(data);
  }

  findBySlug(slug: string) {
    return CategoryModel.findOne({ slug, deleted_at: null });
  }

  findById(id: string) {
    return CategoryModel.findOne({ _id: id, deleted_at: null });
  }

  listAll() {
    return CategoryModel.find({ deleted_at: null }).sort({ createdAt: -1 }).lean();
  }

  updateById(id: string, data: any) {
    return CategoryModel.findOneAndUpdate(
      { _id: id, deleted_at: null },
      data,
      { new: true }
    );
  }

  softDeleteById(id: string) {
    return CategoryModel.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { deleted_at: new Date(), isActive: false },
      { new: true }
    );
  }
}
