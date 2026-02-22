import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { BlogService } from "../services/blog.service";

const service = new BlogService();

export class AdminBlogController {
  // POST /api/admin/blogs
  async create(req: AuthRequest, res: Response) {
    const cover = (req as any).file as Express.Multer.File | undefined;
    const created = await service.create(req.body, cover ?? null, req.user?.id ?? null);
    return res.status(201).json({ success: true, data: created });
  }

  // GET /api/admin/blogs?page=&limit=&search=&status=
  async list(req: AuthRequest, res: Response) {
    const result = await service.adminList(req.query);
    return res.status(200).json({ success: true, data: result.data, meta: result.meta });
  }

  // GET /api/admin/blogs/:id
  async getById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid blog id");
    const data = await service.adminGetById(id);
    if (!data) throw new HttpError(404, "Blog not found");
    return res.status(200).json({ success: true, data });
  }

  // PUT /api/admin/blogs/:id
  async update(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid blog id");

    const cover = (req as any).file as Express.Multer.File | undefined;
    const updated = await service.adminUpdate(id, req.body, cover ?? null);
    return res.status(200).json({ success: true, data: updated });
  }

  // DELETE /api/admin/blogs/:id
  async remove(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid blog id");
    const updated = await service.adminSoftDelete(id);
    return res.status(200).json({ success: true, data: updated });
  }
}