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
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset";
  if (s === "pending") return `${base} bg-amber-50 text-amber-700 ring-amber-200`;
  if (s === "confirmed") return `${base} bg-blue-50 text-blue-700 ring-blue-200`;
  if (s === "shipped") return `${base} bg-indigo-50 text-indigo-700 ring-indigo-200`;
  if (s === "delivered") return `${base} bg-emerald-50 text-emerald-700 ring-emerald-200`;
  if (s === "cancelled") return `${base} bg-rose-50 text-rose-700 ring-rose-200`;
  return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs text-slate-500">Admin / Orders</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
            <p className="mt-1 text-sm text-slate-600">Manage user orders and update order status.</p>
          </div>

          <div className="text-sm text-slate-600">
            Total orders: <b className="text-slate-900">{total}</b>
          </div>
        </div>

        {/* Search */}
        <Card className="rounded-3xl border-slate-200 bg-white p-4 sm:p-5 shadow-sm mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 w-full md:w-[560px]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order id / user email / name..."
                className="flex-1 h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
              />

              <Button
                className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                onClick={() => {
                  setPage(1);
                  fetchData(1);
                }}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>

            <Button
              variant="outline"
              className="h-11 rounded-2xl border-slate-200 bg-white hover:bg-slate-100"
              onClick={() => fetchData(page)}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Table */}
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[1050px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-3 sm:p-4 font-semibold">Order</th>
                  <th className="p-3 sm:p-4 font-semibold">User</th>
                  <th className="p-3 sm:p-4 font-semibold">Email</th>
                  <th className="p-3 sm:p-4 font-semibold">Items</th>
                  <th className="p-3 sm:p-4 font-semibold">Total</th>
                  <th className="p-3 sm:p-4 font-semibold">Status</th>
                  <th className="p-3 sm:p-4 font-semibold">Created</th>
                  <th className="p-3 sm:p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
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
                    <tr key={o._id} className="border-t border-slate-200">
                      <td className="p-3 sm:p-4">
                        <div className="font-mono text-xs text-slate-700">{String(o._id).slice(-10)}</div>
                        <div className="mt-1 text-xs text-slate-500">#{String(o._id).slice(-6)}</div>
                      </td>

                      <td className="p-3 sm:p-4 text-slate-900 font-medium">{o.userName || "-"}</td>

                      <td className="p-3 sm:p-4 text-slate-700">{o.userEmail || "-"}</td>

                      <td className="p-3 sm:p-4 text-slate-700">{o.itemsCount ?? 0}</td>

                      <td className="p-3 sm:p-4 font-semibold text-emerald-700">{money(o.total)}</td>

                      <td className="p-3 sm:p-4">
                        <span className={badge(o.status)}>{o.status}</span>
                      </td>

                      <td className="p-3 sm:p-4 text-slate-600">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                      </td>

                      <td className="p-3 sm:p-4 text-right">
                        <Link href={`/admin/orders/${o._id}`}>
                          <Button
                            variant="outline"
                            className="h-10 rounded-2xl border-slate-200 bg-white hover:bg-slate-100"
                          >
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

        {/* Pagination */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 bg-white hover:bg-slate-100"
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
            className="h-11 rounded-2xl border-slate-200 bg-white hover:bg-slate-100"
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
    </div>
  );
}
