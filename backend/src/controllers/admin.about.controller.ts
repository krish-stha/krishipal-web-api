import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { AboutService } from "../services/about.service";

const service = new AboutService();

export class AdminAboutController {
  // GET /api/admin/about
  async get(req: AuthRequest, res: Response) {
    const doc = await service.getOrCreate();
    return res.status(200).json({ success: true, data: doc });
  }

  // PUT /api/admin/about
  async update(req: AuthRequest, res: Response) {
    const updated = await service.update(req.body || {});
    return res.status(200).json({ success: true, data: updated });
  }

  // POST /api/admin/about/mission-image
  async uploadMissionImage(req: any, res: Response) {
    if (!req.file) return res.status(400).json({ success: false, message: "Image is required" });

    const updated = await service.update({ missionImage: req.file.filename });
    return res.status(200).json({ success: true, data: updated });
  }

  // POST /api/admin/about/vision-image
  async uploadVisionImage(req: any, res: Response) {
    if (!req.file) return res.status(400).json({ success: false, message: "Image is required" });

    const updated = await service.update({ visionImage: req.file.filename });
    return res.status(200).json({ success: true, data: updated });
  }
}