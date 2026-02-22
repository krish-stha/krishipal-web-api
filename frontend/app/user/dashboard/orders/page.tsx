"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import { getMyOrders } from "@/lib/api/order";

function statusBadge(status: string) {
  const base = "text-xs px-2 py-1 rounded-full font-semibold";
  switch (status) {
    case "pending":
      return `${base} bg-yellow-50 text-yellow-700`;
    case "confirmed":
      return `${base} bg-blue-50 text-blue-700`;
    case "shipped":
      return `${base} bg-purple-50 text-purple-700`;
    case "delivered":
      return `${base} bg-green-50 text-green-700`;
    case "cancelled":
      return `${base} bg-red-50 text-red-700`;
    default:
      return `${base} bg-slate-100 text-slate-700`;
  }
}

export default function MyOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  const fetchData = async (p = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyOrders(p, limit);
      setRows(res?.data || []);
      setTotal(res?.meta?.total || 0);
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-6">
            <div className="text-sm text-slate-500">Account / Orders</div>
            <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
            <p className="text-slate-600 mt-1">Track your orders and their status.</p>
          </div>

          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

          <Card className="rounded-2xl overflow-hidden">
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
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td className="p-6 text-slate-600" colSpan={6}>
                        No orders yet.{" "}
                        <Link className="text-green-700 font-semibold" href="/user/dashboard/shop">
                          Shop now
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    rows.map((o) => (
                      <tr key={o._id} className="border-t">
                        <td className="p-3 font-mono text-xs text-slate-600">{o._id}</td>
                        <td className="p-3">{(o.items || []).length}</td>
                        <td className="p-3 font-semibold text-green-700">Rs. {o.total}</td>
                        <td className="p-3">
                          <span className={statusBadge(String(o.status))}>{o.status}</span>
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
      </main>

      <Footer />
    </div>
  );
}
