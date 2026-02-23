"use client";

import { useEffect, useState } from "react";
import { adminDashboardSummary } from "@/lib/api/admin/dashboard";
import { Card, CardContent } from "@/app/auth/components/ui/card";
import { StatCard } from "../components/StatCard";
import { RevenueChart } from "../components/RevenueChart";
import { RecentUsers } from "../components/RecentUsers";
import { RecentOrders } from "../components/RecentOrders";


export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await adminDashboardSummary({ months: 6 });
        if (!alive) return;
        setData(res.data);
        setErr(null);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load dashboard");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold text-slate-900">Dashboard</div>
        <div className="text-sm text-slate-500 mt-1">
          Store overview and recent activity.
        </div>
      </div>

      {err && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">
            {err}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={loading ? "..." : data?.totals?.users ?? 0} />
        <StatCard title="Total Orders" value={loading ? "..." : data?.totals?.orders ?? 0} />
        <StatCard title="Paid Orders" value={loading ? "..." : data?.totals?.paidOrders ?? 0} />
        <StatCard title="Total Revenue" value={loading ? "..." : `Rs. ${data?.totals?.revenue ?? 0}`} />
        <StatCard title="Products" value={loading ? "..." : data?.totals?.products ?? 0} />
        <StatCard title="Blogs" value={loading ? "..." : data?.totals?.blogs ?? 0} />
      </div>

      {/* Chart */}
      <RevenueChart loading={loading} rows={data?.monthlyRevenue ?? []} />

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentOrders loading={loading} rows={data?.recentOrders ?? []} />
        <RecentUsers loading={loading} rows={data?.recentUsers ?? []} />
      </div>
    </div>
  );
}