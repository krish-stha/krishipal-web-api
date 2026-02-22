import { HttpError } from "../errors/http-error";
import { CategoryRepository } from "../repositories/category.repository";
import { toSlug } from "../utils/slug";

const repo = new CategoryRepository();

export class CategoryService {
  async create(payload: any) {
    const slugBase = toSlug(payload.name);
    let slug = slugBase;

    // ensure unique slug
    let i = 1;
    while (await repo.findBySlug(slug)) {
      slug = `${slugBase}-${i++}`;
    }

    return repo.create({
      name: payload.name,
      slug,
      parent: payload.parentId ?? null,
      isActive: payload.isActive ?? true,
      deleted_at: null,
    });
  }

  list() {
    return repo.listAll();
  }

  async getById(id: string) {
    const cat = await repo.findById(id);
    if (!cat) throw new HttpError(404, "Category not found");
    return cat;
  }

  async update(id: string, payload: any) {
    const existing = await repo.findById(id);
    if (!existing) throw new HttpError(404, "Category not found");

    const data: any = { ...payload };

    if (payload.name) {
      const slugBase = toSlug(payload.name);
      let slug = slugBase;
      let i = 1;

      // unique slug (ignore self)
      while (true) {
        const found = await repo.findBySlug(slug);
        if (!found || String(found._id) === String(id)) break;
        slug = `${slugBase}-${i++}`;
      }
      data.slug = slug;
    }

    if (payload.parentId !== undefined) {
      data.parent = payload.parentId ?? null;
    }

    const updated = await repo.updateById(id, data);
    if (!updated) throw new HttpError(404, "Category not found");
    return updated;
  }

  async remove(id: string) {
    const updated = await repo.softDeleteById(id);
    if (!updated) throw new HttpError(404, "Category not found");
    return updated;
  }
}
