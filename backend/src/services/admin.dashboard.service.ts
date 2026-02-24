// services/admin.dashboard.service.ts
import { UserModel } from "../models/user.model";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { BlogModel } from "../models/blog.model";

type GroupBy = "day" | "month";

function parseYmdUtc(s?: string): Date | null {
  const v = String(s || "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ymdUtc(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ymUtc(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function addDaysUtc(d: Date, days: number) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function daysDiffInclusive(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  const d = Math.floor(ms / (24 * 60 * 60 * 1000));
  return d + 1;
}

export class AdminDashboardService {
  async getSummary(opts: { months: number; from?: string; to?: string; groupBy?: GroupBy }) {
    const months = Math.max(1, Math.min(36, Number(opts.months || 6)));
    const now = new Date();

    // default months-window start (UTC month start)
    const defaultStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1, 0, 0, 0));

    const fromDate = parseYmdUtc(opts.from);
    const toDateRaw = parseYmdUtc(opts.to);
    const toDate = toDateRaw ? new Date(toDateRaw.getTime() + 24 * 60 * 60 * 1000 - 1) : null; // end-of-day

    const hasRange = Boolean(fromDate && toDateRaw);
    const groupBy: GroupBy = opts.groupBy === "day" ? "day" : "month";

    // ✅ order filter range
    const createdAtRange: any = {};
    if (fromDate) createdAtRange.$gte = fromDate;
    if (toDate) createdAtRange.$lte = toDate;

    // ✅ paidAt filter range (revenue should use paidAt)
    const paidAtRange: any = {};
    if (fromDate) paidAtRange.$gte = fromDate;
    if (toDate) paidAtRange.$lte = toDate;

    const orderWhere: any = { deleted_at: null };
    if (hasRange) orderWhere.createdAt = createdAtRange;
    else orderWhere.createdAt = { $gte: defaultStart };

    const paidOrderWhere: any = {
      deleted_at: null,
      paymentStatus: "paid",
      paidAt: hasRange ? paidAtRange : { $ne: null, $gte: defaultStart },
    };

    const [
      users,
      orders,
      paidOrders,
      revenueAgg,
      products,
      blogs,
      recentUsers,
      recentOrders,
      monthlyAgg,
      dailyAgg,
    ] = await Promise.all([
      UserModel.countDocuments({ deleted_at: null }),
      OrderModel.countDocuments(orderWhere),
      OrderModel.countDocuments(paidOrderWhere),

      OrderModel.aggregate([{ $match: paidOrderWhere }, { $group: { _id: null, revenue: { $sum: "$total" } } }]),

      ProductModel.countDocuments({ deleted_at: null }),
      BlogModel.countDocuments({ deleted_at: null }),

      UserModel.find({ deleted_at: null })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("fullName email role createdAt")
        .lean(),

      OrderModel.find(orderWhere)
        .sort({ createdAt: -1 })
        .limit(8)
        .select("user total status paymentMethod paymentStatus createdAt")
        .populate({ path: "user", select: "fullName email" })
        .lean(),

      // ✅ MONTHLY revenue aggregation
      OrderModel.aggregate([
        { $match: paidOrderWhere },
        {
          $group: {
            _id: { y: { $year: "$paidAt" }, m: { $month: "$paidAt" } },
            revenue: { $sum: "$total" },
            paidOrders: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),

      // ✅ DAILY revenue aggregation (YYYY-MM-DD)
      OrderModel.aggregate([
        { $match: paidOrderWhere },
        {
          $group: {
            _id: {
              day: {
                $dateToString: { format: "%Y-%m-%d", date: "$paidAt", timezone: "UTC" },
              },
            },
            revenue: { $sum: "$total" },
            paidOrders: { $sum: 1 },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]),
    ]);

    const revenue = Number(revenueAgg?.[0]?.revenue ?? 0);

    // ---------------------------
    // ✅ Build CHART rows
    // ---------------------------
    let chartType: GroupBy = groupBy;

    // auto: if hasRange and range <= 31, force day
    if (hasRange && fromDate && toDateRaw) {
      const rangeDays = daysDiffInclusive(fromDate, toDateRaw);
      if (rangeDays <= 31) chartType = "day";
    }

    let revenueTrend: Array<{ label: string; revenue: number; paidOrders: number }> = [];

    if (chartType === "day" && hasRange && fromDate && toDateRaw) {
      // fill days between from..to
      const days = daysDiffInclusive(fromDate, toDateRaw);
      const filled: Array<{ label: string; revenue: number; paidOrders: number }> = [];

      const map = new Map<string, { revenue: number; paidOrders: number }>();
      for (const r of dailyAgg || []) {
        const key = String(r?._id?.day || "");
        if (!key) continue;
        map.set(key, { revenue: Number(r.revenue ?? 0), paidOrders: Number(r.paidOrders ?? 0) });
      }

      for (let i = 0; i < days; i++) {
        const day = addDaysUtc(fromDate, i);
        const key = ymdUtc(day);
        const v = map.get(key) ?? { revenue: 0, paidOrders: 0 };
        filled.push({ label: key, ...v });
      }

      revenueTrend = filled;
    } else {
      // month view: fill last N months (ending current month)
      const filled: Array<{ label: string; revenue: number; paidOrders: number }> = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
        filled.push({ label: ymUtc(d), revenue: 0, paidOrders: 0 });
      }

      const map = new Map<string, { revenue: number; paidOrders: number }>();
      for (const row of monthlyAgg || []) {
        const y = row?._id?.y;
        const m = String(row?._id?.m ?? "").padStart(2, "0");
        if (!y || !m) continue;
        map.set(`${y}-${m}`, { revenue: Number(row.revenue ?? 0), paidOrders: Number(row.paidOrders ?? 0) });
      }

      revenueTrend = filled.map((x) => ({ ...x, ...(map.get(x.label) ?? { revenue: 0, paidOrders: 0 }) }));
    }

    return {
      filters: {
        months,
        from: fromDate ? opts.from : null,
        to: toDateRaw ? opts.to : null,
        hasRange,
        chartType, // ✅ "day" or "month"
      },
      totals: {
        users,
        orders,
        paidOrders,
        revenue,
        products,
        blogs,
      },
      recentOrders: (recentOrders || []).map((o: any) => ({
        _id: o._id,
        total: Number(o.total ?? 0),
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
        user: { fullName: o.user?.fullName ?? "-", email: o.user?.email ?? "-" },
      })),
      recentUsers,
      revenueTrend, // ✅ frontend chart uses this
    };
  }
}