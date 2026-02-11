import { Request, Response } from "express";
import { CategoryModel } from "../models/category.model";

export class PublicCategoryController {
  // GET /api/categories
  async list(_req: Request, res: Response) {
    const data = await CategoryModel.find({
      deleted_at: null,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .select("name slug parent isActive createdAt")
      .lean();

    return res.status(200).json({ success: true, data });
  }
}
