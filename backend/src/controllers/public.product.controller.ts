import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

const service = new ProductService();

export class PublicProductController {
  async list(req: Request, res: Response) {
    const result = await service.listPublic(req.query);
    return res.status(200).json({ success: true, data: result.data, meta: result.meta });
  }

  async getBySlug(req: Request, res: Response) {
    const product = await service.getPublicBySlug(req.params.slug);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return res.status(200).json({ success: true, data: product });
  }
}
