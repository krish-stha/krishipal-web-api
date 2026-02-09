import { Request, Response } from "express";
import z from "zod";
import { CategoryService } from "../services/category.service";
import { AdminCreateCategoryDTO, AdminUpdateCategoryDTO } from "../dtos/category.dto";

const service = new CategoryService();

export class AdminCategoryController {
  async create(req: Request, res: Response) {
    const parsed = AdminCreateCategoryDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: z.prettifyError(parsed.error) });
    }

    const cat = await service.create(parsed.data);
    return res.status(201).json({ success: true, data: cat });
  }

  async list(_req: Request, res: Response) {
    const data = await service.list();
    return res.status(200).json({ success: true, data });
  }

  async getById(req: Request, res: Response) {
    const data = await service.getById(req.params.id);
    return res.status(200).json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const parsed = AdminUpdateCategoryDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: z.prettifyError(parsed.error) });
    }

    const updated = await service.update(req.params.id, parsed.data);
    return res.status(200).json({ success: true, data: updated });
  }

  async remove(req: Request, res: Response) {
    const updated = await service.remove(req.params.id);
    return res.status(200).json({ success: true, data: updated, message: "Category deleted" });
  }
}
