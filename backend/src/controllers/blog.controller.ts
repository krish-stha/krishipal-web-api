import { Request, Response } from "express";
import { BlogService } from "../services/blog.service";
import { HttpError } from "../errors/http-error";

const service = new BlogService();

export class BlogController {
  // GET /api/blogs?page&limit&search&tag
  async list(req: Request, res: Response) {
    const result = await service.publicList(req.query);
    return res.status(200).json({ success: true, data: result.data, meta: result.meta });
  }

  // GET /api/blogs/:slug
  async bySlug(req: Request, res: Response) {
    const slug = String(req.params.slug || "").trim();
    if (!slug) throw new HttpError(400, "Invalid slug");

    const data = await service.publicBySlug(slug);
    if (!data) throw new HttpError(404, "Blog not found");
    return res.status(200).json({ success: true, data });
  }
}