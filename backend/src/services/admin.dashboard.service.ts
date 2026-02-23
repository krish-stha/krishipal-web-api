import { UserModel } from "../models/user.model";
import { OrderModel } from "../models/order.model";
import { ProductModel } from "../models/product.model";
import { BlogModel } from "../models/blog.model"; // you already have this
import mongoose from "mongoose";

function monthKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export class AdminDashboardService {
  async getSummary({ months }: { months: number }) {
    // start date = beginning of (months-1) months ago
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1, 0, 0, 0));

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
      UserModel.countDocuments({ deleted_at: null }),
      OrderModel.countDocuments({ deleted_at: null }),
      OrderModel.countDocuments({ deleted_at: null, paymentStatus: "paid" }),
      OrderModel.aggregate([
        { $match: { deleted_at: null, paymentStatus: "paid",paidAt: { $ne: null, $gte: start }, } },
        { $group: {
      _id: { y: { $year: "$paidAt" }, m: { $month: "$paidAt" } },
      revenue: { $sum: "$total" },
      paidOrders: { $sum: 1 },
    }, },{ $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
      ProductModel.countDocuments({ deleted_at: null }),
      BlogModel.countDocuments({ deleted_at: null }),

      UserModel.find({ deleted_at: null })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("fullName email role createdAt")
        .lean(),

      OrderModel.find({ deleted_at: null })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("user total status paymentMethod paymentStatus createdAt")
        .populate({ path: "user", select: "fullName email" })
        .lean(),

      OrderModel.aggregate([
        {
          $match: {
            deleted_at: null,
            paymentStatus: "paid",
            createdAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            revenue: { $sum: "$total" },
            paidOrders: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]),
    ]);

    const revenue = Number(revenueAgg?.[0]?.revenue ?? 0);

    // Build a filled months array (even if zero)
    const filledMonths: Array<{ month: string; revenue: number; paidOrders: number }> = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
      filledMonths.push({ month: monthKey(d), revenue: 0, paidOrders: 0 });
    }

    const map = new Map<string, { revenue: number; paidOrders: number }>();
    for (const row of monthlyRevenueAgg) {
      const m = String(row._id.m).padStart(2, "0");
      const key = `${row._id.y}-${m}`;
      map.set(key, { revenue: Number(row.revenue ?? 0), paidOrders: Number(row.paidOrders ?? 0) });
    }

    const monthlyRevenue = filledMonths.map((x) => ({
      ...x,
      ...(map.get(x.month) ?? { revenue: 0, paidOrders: 0 }),
    }));

    return {
      totals: {
        users,
        orders,
        paidOrders,
        revenue,
        products,
        blogs,
      },
      recentOrders: recentOrders.map((o: any) => ({
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