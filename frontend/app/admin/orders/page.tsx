"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import { adminListOrders } from "@/lib/api/admin/order";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

function badge(status: string) {
  const s = String(status || "pending");
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  if (s === "pending") return `${base} bg-amber-50 text-amber-700 border border-amber-200`;
  if (s === "confirmed") return `${base} bg-blue-50 text-blue-700 border border-blue-200`;
  if (s === "shipped") return `${base} bg-indigo-50 text-indigo-700 border border-indigo-200`;
  if (s === "delivered") return `${base} bg-green-50 text-green-700 border border-green-200`;
  if (s === "cancelled") return `${base} bg-red-50 text-red-700 border border-red-200`;
  return `${base} bg-slate-50 text-slate-700 border border-slate-200`;
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const fetchData = async (p = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminListOrders({ page: p, limit, search: search.trim() || undefined });
      setRows(res.data?.data || []);
      setTotal(res.data?.meta?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load orders");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="text-sm text-slate-500">Admin / Orders</div>
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="text-slate-600 mt-1">Manage user orders and update order status.</p>
      </div>

      <Card className="rounded-2xl p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex gap-2 w-full md:w-[520px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order id / user email / name..."
              className="flex-1 h-10 rounded-xl border bg-white px-3 outline-none focus:ring-2 focus:ring-green-200"
            />
            <Button
              className="h-10 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                setPage(1);
                fetchData(1);
              }}
              disabled={loading}
            >
              Search
            </Button>
          </div>

          <div className="text-sm text-slate-600">
            Total orders: <b className="text-slate-900">{total}</b>
          </div>
        </div>
      </Card>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <Card className="rounded-2xl overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[1050px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-3 font-semibold">Order</th>
                <th className="p-3 font-semibold">User</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Items</th>
                <th className="p-3 font-semibold">Total</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Created</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={8}>
                    Loading orders...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={8}>
                    No orders found
                  </td>
                </tr>
              ) : (
                rows.map((o) => (
                  <tr key={o._id} className="border-t">
                    <td className="p-3 font-mono text-xs text-slate-700">{String(o._id).slice(-10)}</td>
                    <td className="p-3">{o.userName || "-"}</td>
                    <td className="p-3">{o.userEmail || "-"}</td>
                    <td className="p-3">{o.itemsCount ?? 0}</td>
                    <td className="p-3 font-semibold text-green-700">{money(o.total)}</td>
                    <td className="p-3">
                      <span className={badge(o.status)}>{o.status}</span>
                    </td>
                    <td className="p-3 text-slate-600">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/orders/${o._id}`}>
                        <Button variant="outline" className="border-slate-300">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="outline"
          className="border-slate-300"
          disabled={loading || page <= 1}
          onClick={() => {
            const p = Math.max(1, page - 1);
            setPage(p);
            fetchData(p);
          }}
        >
          Prev
        </Button>

        <div className="text-sm text-slate-600">
          Page <b className="text-slate-900">{page}</b> / {totalPages}
        </div>

        <Button
          variant="outline"
          className="border-slate-300"
          disabled={loading || page >= totalPages}
          onClick={() => {
            const p = Math.min(totalPages, page + 1);
            setPage(p);
            fetchData(p);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
