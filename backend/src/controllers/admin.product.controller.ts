import { Request, Response } from "express";
import z from "zod";
import { ProductService } from "../services/product.service";
import { AdminCreateProductDTO, AdminUpdateProductDTO } from "../dtos/product.dto";

const service = new ProductService();

export class AdminProductController {
  async create(req: Request, res: Response) {
    const parsed = AdminCreateProductDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: z.prettifyError(parsed.error) });
    }

    const files = ((req as any).files || []) as Express.Multer.File[];
    const created = await service.create(parsed.data, files);

    return res.status(201).json({ success: true, data: created });
  }

  async list(_req: Request, res: Response) {
    const data = await service.listAdmin();
    return res.status(200).json({ success: true, data });
  }

  async getById(req: Request, res: Response) {
    const data = await service.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Product not found" });
    return res.status(200).json({ success: true, data });
  }

  async update(req: Request, res: Response) {
    const parsed = AdminUpdateProductDTO.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: z.prettifyError(parsed.error) });
    }

    const files = ((req as any).files || []) as Express.Multer.File[];
    const updated = await service.update(req.params.id, parsed.data, files);

    return res.status(200).json({ success: true, data: updated });
  }

  async remove(req: Request, res: Response) {
    const updated = await service.softDelete(req.params.id);
    return res.status(200).json({ success: true, data: updated, message: "Product soft deleted" });
  }

  async hardRemove(req: Request, res: Response) {
    const deleted = await service.hardDelete(req.params.id);
    return res.status(200).json({ success: true, data: deleted, message: "Product hard deleted" });
  }
}
