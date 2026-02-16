"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { getMyOrders } from "@/lib/api/order";

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

export default function MyOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const limit = 10;

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const fetchData = async (p = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyOrders(p, limit);
      setRows(res?.data || []);
      setTotal(res?.meta?.total || 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load your orders");
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="text-sm text-slate-500">My Account</div>
            <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
            <p className="text-slate-600 mt-1">Track your order status here.</p>
          </div>

          {error && <div className="text-red-600 mb-4">{error}</div>}

          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="p-3 font-semibold">Order</th>
                    <th className="p-3 font-semibold">Items</th>
                    <th className="p-3 font-semibold">Total</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={6}>
                        Loading orders...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={6}>
                        You don’t have any orders yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((o) => {
                      const itemsCount = (o.items || []).reduce(
                        (sum: number, it: any) => sum + Number(it.qty || 0),
                        0
                      );

                      return (
                        <tr key={o._id} className="border-t">
                          <td className="p-3 font-mono text-xs text-slate-700">
                            {String(o._id).slice(-10)}
                          </td>
                          <td className="p-3">{itemsCount}</td>
                          <td className="p-3 font-semibold text-green-700">{money(o.total)}</td>
                          <td className="p-3">
                            <span className={badge(o.status)}>{o.status}</span>
                          </td>
                          <td className="p-3 text-slate-600">
                            {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                          </td>
                          <td className="p-3 text-right">
                            <Link href={`/user/dashboard/orders/${o._id}`}>
                              <Button variant="outline" className="border-slate-300">
                                Track
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
      </main>

      <Footer />
    </div>
  );
}
