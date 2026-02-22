import { HttpError } from "../errors/http-error";
import { BlogModel } from "../models/blog.model";
import { toSlug } from "../utils/blogSlug";

function cleanTags(tags: any): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).map(t => t.trim()).filter(Boolean);
  // allow comma separated: "a,b,c"
  return String(tags)
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

export class BlogService {
  async create(payload: any, coverFile?: Express.Multer.File | null, authorId?: string | null) {
    const title = String(payload.title || "").trim();
    if (!title) throw new HttpError(400, "Title is required");

    const excerpt = String(payload.excerpt || "").trim();
    const content = String(payload.content || "");

    const status = String(payload.status || "draft").toLowerCase();
    if (!["draft", "published"].includes(status)) throw new HttpError(400, "Invalid status");

    const base = toSlug(title);
    let slug = base;
    let i = 1;
    while (await BlogModel.findOne({ slug })) slug = `${base}-${i++}`;

    const coverImage = coverFile?.filename ?? null;

    const publishedAt = status === "published" ? new Date() : null;

    const created = await BlogModel.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      tags: cleanTags(payload.tags),
      status,
      publishedAt,
      author: authorId ?? null,
      deleted_at: null,
    });

    return created;
  }

  async adminList(q: any) {
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(q.limit ?? 10)));
    const skip = (page - 1) * limit;

    const search = String(q.search ?? "").trim();
    const status = String(q.status ?? "").trim().toLowerCase();

    const filter: any = { deleted_at: null };
    if (status && ["draft", "published"].includes(status)) filter.status = status;

    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ title: re }, { excerpt: re }, { tags: re }];
    }

    const [rows, total] = await Promise.all([
      BlogModel.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title slug excerpt coverImage tags status publishedAt createdAt updatedAt")
        .lean(),
      BlogModel.countDocuments(filter),
    ]);

    return { data: rows, meta: { total, page, limit } };
  }

  adminGetById(id: string) {
  return BlogModel.findOne({ _id: id, deleted_at: null }) 
    .select("title slug excerpt content coverImage tags status publishedAt createdAt updatedAt")
    .lean();
}

  async adminUpdate(id: string, payload: any, coverFile?: Express.Multer.File | null) {
    const existing = await BlogModel.findOne({ _id: id, deleted_at: null });
    if (!existing) throw new HttpError(404, "Blog not found");

    const data: any = {};

    if (payload.title !== undefined) {
      const title = String(payload.title || "").trim();
      if (!title) throw new HttpError(400, "Title cannot be empty");
      data.title = title;

      const base = toSlug(title);
      let slug = base;
      let i = 1;
      while (true) {
        const found = await BlogModel.findOne({ slug });
        if (!found || String(found._id) === String(id)) break;
        slug = `${base}-${i++}`;
      }
      data.slug = slug;
    }

    if (payload.excerpt !== undefined) data.excerpt = String(payload.excerpt || "").trim();
    if (payload.content !== undefined) data.content = String(payload.content || "");
    if (payload.tags !== undefined) data.tags = cleanTags(payload.tags);

    if (payload.status !== undefined) {
      const status = String(payload.status || "").toLowerCase();
      if (!["draft", "published"].includes(status)) throw new HttpError(400, "Invalid status");
      data.status = status;

      // only set publishedAt when switching draft -> published
      if (status === "published" && !existing.publishedAt) data.publishedAt = new Date();
      if (status === "draft") data.publishedAt = null;
    }

    if (coverFile) data.coverImage = coverFile.filename;

    const updated = await BlogModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
    return updated;
  }

  async adminSoftDelete(id: string) {
    const updated = await BlogModel.findByIdAndUpdate(
      id,
      { $set: { deleted_at: new Date() } },
      { new: true }
    ).lean();
    if (!updated) throw new HttpError(404, "Blog not found");
    return updated;
  }

  // PUBLIC
  async publicList(q: any) {
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(24, Math.max(1, Number(q.limit ?? 9)));
    const skip = (page - 1) * limit;

    const search = String(q.search ?? "").trim();
    const tag = String(q.tag ?? "").trim();

    const filter: any = { deleted_at: null, status: "published" };
    if (tag) filter.tags = tag;

    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ title: re }, { excerpt: re }, { tags: re }];
    }

    const [rows, total] = await Promise.all([
      BlogModel.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("title slug excerpt coverImage tags publishedAt")
        .lean(),
      BlogModel.countDocuments(filter),
    ]);

    return { data: rows, meta: { total, page, limit } };
  }

  publicBySlug(slug: string) {
    return BlogModel.findOne({
      slug,
      deleted_at: null,
      status: "published",
    })
      .select("title slug excerpt content coverImage tags publishedAt createdAt updatedAt")
      .lean();
  }
}