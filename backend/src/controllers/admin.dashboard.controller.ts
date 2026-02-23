import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { AdminDashboardService } from "../services/admin.dashboard.service";

const service = new AdminDashboardService();

export class AdminDashboardController {
  async summary(req: AuthRequest, res: Response) {
    const months = Math.min(24, Math.max(3, Number(req.query.months ?? 6)));
    const data = await service.getSummary({ months });
    return res.status(200).json({ success: true, data });
  }
}