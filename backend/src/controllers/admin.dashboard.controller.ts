// controllers/admin.dashboard.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { HttpError } from "../errors/http-error";
import { AdminDashboardService } from "../services/admin.dashboard.service";

function isYmd(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export class AdminDashboardController {
  private service = new AdminDashboardService();

  async summary(req: AuthRequest, res: Response) {
    const months = Math.max(1, Math.min(36, Number(req.query.months || 6)));

    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    const groupByRaw = String(req.query.groupBy || "").trim().toLowerCase();
    const groupBy: "day" | "month" = groupByRaw === "day" ? "day" : "month";

    if (from && !isYmd(from)) throw new HttpError(400, "Invalid from date (use YYYY-MM-DD)");
    if (to && !isYmd(to)) throw new HttpError(400, "Invalid to date (use YYYY-MM-DD)");

    const data = await this.service.getSummary({
      months,
      from: from || undefined,
      to: to || undefined,
      groupBy,
    });

    return res.status(200).json({ success: true, data });
  }
}