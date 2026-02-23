"use client";

import { useEffect, useState } from "react";
import { adminDashboardSummary } from "@/lib/api/admin/dashboard";
import { Card, CardContent } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import { StatCard } from "../components/StatCard";
import { RevenueChart } from "../components/RevenueChart";
import { RecentUsers } from "../components/RecentUsers";
import { RecentOrders } from "../components/RecentOrders";

function ymd(d: Date) {
  // YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // ✅ NEW date range states
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const load = async (params?: { months?: number; from?: string; to?: string }) => {
    try {
      setLoading(true);
      const res = await adminDashboardSummary(params);
      setData(res?.data);
      setErr(null);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // initial load (default months = 6)
  useEffect(() => {
    load({ months: 6 });
  }, []);

  const apply = () => {
    // basic validation
    if (from && to && from > to) {
      setErr("From date cannot be after To date");
      return;
    }
    setErr(null);
    load({
      months: 6, // keep chart “slots”
      from: from || undefined,
      to: to || undefined,
    });
  };

  const clear = () => {
    setFrom("");
    setTo("");
    setErr(null);
    load({ months: 6 });
  };

  const quickToday = () => {
    const t = ymd(new Date());
    setFrom(t);
    setTo(t);
    setErr(null);
    load({ months: 6, from: t, to: t });
  };

  const quick7d = () => {
    const now = new Date();
    const d = new Date();
    d.setDate(now.getDate() - 6); // last 7 days incl today
    const f = ymd(d);
    const t = ymd(now);
    setFrom(f);
    setTo(t);
    setErr(null);
    load({ months: 6, from: f, to: t });
  };

  const quick30d = () => {
    const now = new Date();
    const d = new Date();
    d.setDate(now.getDate() - 29);
    const f = ymd(d);
    const t = ymd(now);
    setFrom(f);
    setTo(t);
    setErr(null);
    load({ months: 6, from: f, to: t });
  };

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-2xl font-semibold text-slate-900">Dashboard</div>
          <div className="text-sm text-slate-500 mt-1">Store overview and recent activity.</div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {/* Quick presets */}
          <Button variant="outline" className="border-slate-300" onClick={quickToday} disabled={loading}>
            Today
          </Button>
          <Button variant="outline" className="border-slate-300" onClick={quick7d} disabled={loading}>
            Last 7D
          </Button>
          <Button variant="outline" className="border-slate-300" onClick={quick30d} disabled={loading}>
            Last 30D
          </Button>

          <div className="w-px h-9 bg-slate-200 mx-1" />

          {/* Range pickers */}
          <div className="flex flex-col">
            <div className="text-xs text-slate-600 mb-1">From</div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
            />
          </div>

          <div className="flex flex-col">
            <div className="text-xs text-slate-600 mb-1">To</div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
            />
          </div>

          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={apply} disabled={loading}>
            Apply
          </Button>

          <Button variant="outline" className="border-slate-300" onClick={clear} disabled={loading}>
            Clear
          </Button>
        </div>
      </div>

      {/* Error */}
      {err && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-700">{err}</CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={loading ? "..." : data?.totals?.users ?? 0} />
        <StatCard title="Products" value={loading ? "..." : data?.totals?.products ?? 0} />
        <StatCard title="Blogs" value={loading ? "..." : data?.totals?.blogs ?? 0} />
        <StatCard title="Total Orders" value={loading ? "..." : data?.totals?.orders ?? 0} />
        <StatCard title="Paid Orders" value={loading ? "..." : data?.totals?.paidOrders ?? 0} />
        <StatCard title="Total Revenue" value={loading ? "..." : `Rs. ${data?.totals?.revenue ?? 0}`} />
        
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