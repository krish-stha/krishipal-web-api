import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { SettingsService } from "../services/settings.service";

const service = new SettingsService();

export class AdminSettingsController {
  // GET /api/admin/settings
  async get(req: AuthRequest, res: Response) {
    const s = await service.getOrCreate();
    return res.status(200).json({ success: true, data: s });
  }

  // PUT /api/admin/settings
  async update(req: AuthRequest, res: Response) {
    const updated = await service.update(req.body || {});
    return res.status(200).json({ success: true, data: updated });
  }

  async uploadLogo(req: any, res: Response) {
    // multer puts file in req.file
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Logo is required" });
    }

    const updated = await service.update({
      storeLogo: req.file.filename, // saved filename only
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  }
}