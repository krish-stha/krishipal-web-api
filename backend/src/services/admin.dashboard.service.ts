// services/admin.dashboard.service.ts
import { UserModel } from "../models/user.model";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { BlogModel } from "../models/blog.model";

// ✅ Month key like "2026-02"
function monthKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ✅ strict date parser for "YYYY-MM-DD" -> UTC Date
function parseYmdUtc(s?: string): Date | null {
  const v = String(s || "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  // safe UTC parse
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export class AdminDashboardService {
  async getSummary(opts: { months: number; from?: string; to?: string }) {
    const months = Math.max(1, Math.min(36, Number(opts.months || 6))); // clamp 1..36
    const now = new Date();

    // ✅ fallback window = beginning of (months-1) months ago (UTC)
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1, 0, 0, 0)
    );

    // ✅ optional exact range (UTC)
    const fromDate = parseYmdUtc(opts.from);
    const toDateRaw = parseYmdUtc(opts.to);
    const toDate = toDateRaw ? new Date(toDateRaw.getTime() + 24 * 60 * 60 * 1000 - 1) : null; // end-of-day

    const hasRange = Boolean(fromDate || toDate);

    // ✅ build createdAt range
    const createdAtRange: any = {};
    if (fromDate) createdAtRange.$gte = fromDate;
    if (toDate) createdAtRange.$lte = toDate;

    // ✅ build paidAt range (better for revenue)
    const paidAtRange: any = {};
    if (fromDate) paidAtRange.$gte = fromDate;
    if (toDate) paidAtRange.$lte = toDate;

    // ✅ decide effective filters
    const effectiveCreatedAtRange = hasRange ? createdAtRange : { $gte: start };
    const effectivePaidAtRange = hasRange ? paidAtRange : { $ne: null, $gte: start };

    // ✅ base where clauses
    const orderWhere: any = { deleted_at: null };
    if (hasRange) orderWhere.createdAt = createdAtRange; // exact range
    // if no range: you can keep orders total "all time" OR "months window"
    // choose what you want:
    // - all-time orders: do nothing when !hasRange
    // - months-window orders: uncomment next line
    if (!hasRange) orderWhere.createdAt = { $gte: start };

    const paidOrderWhere: any = {
      deleted_at: null,
      paymentStatus: "paid",
      paidAt: effectivePaidAtRange,
    };

    // ✅ run queries
    const [
      users,
      orders,
      paidOrders,
      revenueAgg,
      products,
      blogs,
      recentUsers,
      recentOrders,
      monthlyRevenueAgg,
    ] = await Promise.all([
      // totals
      UserModel.countDocuments({ deleted_at: null }),
      OrderModel.countDocuments(orderWhere),
      OrderModel.countDocuments(paidOrderWhere),

      // ✅ total revenue in range (or months fallback) based on paidAt
      OrderModel.aggregate([
        { $match: paidOrderWhere },
        { $group: { _id: null, revenue: { $sum: "$total" } } },
      ]),

      ProductModel.countDocuments({ deleted_at: null }),
      BlogModel.countDocuments({ deleted_at: null }),

      // recent users (optionally range-filtered by createdAt)
      UserModel.find({
        deleted_at: null,
        ...(hasRange ? { createdAt: createdAtRange } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("fullName email role createdAt")
        .lean(),

      // recent orders (respect orderWhere window)
      OrderModel.find(orderWhere)
        .sort({ createdAt: -1 })
        .limit(8)
        .select("user total status paymentMethod paymentStatus createdAt")
        .populate({ path: "user", select: "fullName email" })
        .lean(),

      // ✅ monthly revenue chart based on paidAt
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
    ]);

    const revenue = Number(revenueAgg?.[0]?.revenue ?? 0);

    // ✅ build filled months array
    // if exact range is used, we still show "months" slots ending at current month.
    // (simple + works with your existing chart)
    const filledMonths: Array<{ month: string; revenue: number; paidOrders: number }> = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1)
      );
      filledMonths.push({ month: monthKey(d), revenue: 0, paidOrders: 0 });
    }

    const map = new Map<string, { revenue: number; paidOrders: number }>();
    for (const row of monthlyRevenueAgg || []) {
      if (!row?._id) continue;
      const m = String(row._id.m).padStart(2, "0");
      const key = `${row._id.y}-${m}`;
      map.set(key, {
        revenue: Number(row.revenue ?? 0),
        paidOrders: Number(row.paidOrders ?? 0),
      });
    }

    const monthlyRevenue = filledMonths.map((x) => ({
      ...x,
      ...(map.get(x.month) ?? { revenue: 0, paidOrders: 0 }),
    }));

    return {
      filters: {
        months,
        from: fromDate ? opts.from : null,
        to: toDate ? opts.to : null,
        hasRange,
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
        user: {
          fullName: o.user?.fullName ?? "-",
          email: o.user?.email ?? "-",
        },
      })),
      recentUsers,
      monthlyRevenue,
    };
  }
}