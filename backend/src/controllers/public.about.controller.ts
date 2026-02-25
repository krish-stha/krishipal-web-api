import { Request, Response } from "express";
import { AboutService } from "../services/about.service";

const service = new AboutService();

export class PublicAboutController {
  // GET /api/about
  async get(_req: Request, res: Response) {
    const doc = await service.getPublic();
    return res.status(200).json({ success: true, data: doc });
  }
}