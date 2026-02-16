"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { getMyOrderById } from "@/lib/api/order";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

const steps = ["pending", "confirmed", "shipped", "delivered"] as const;

function statusIndex(status: string) {
  const s = String(status || "pending");
  const idx = steps.indexOf(s as any);
  return idx === -1 ? 0 : idx;
}

function statusLabel(status: string) {
  const s = String(status || "pending");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function OrderTrackPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);

  const fetchOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyOrderById(id);
      setOrder(res?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load order");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const items = order?.items || [];

  const itemsCount = useMemo(() => {
    return items.reduce((sum: number, it: any) => sum + Number(it.qty || 0), 0);
  }, [items]);

  const curStatus = String(order?.status || "pending");
  const curIdx = statusIndex(curStatus);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">My Orders / Track</div>
              <h1 className="text-3xl font-bold text-slate-900">Track Order</h1>
              <p className="text-slate-600 mt-1 font-mono text-xs">
                Order ID: {id}
              </p>
            </div>

            <Button variant="outline" className="border-slate-300" onClick={() => router.push("/user/dashboard/orders")}>
              Back
            </Button>
          </div>

          {error && <div className="text-red-600 mb-4">{error}</div>}

          <div className="rounded-2xl border bg-white shadow-sm p-6">
            {loading ? (
              <div className="text-slate-600">Loading...</div>
            ) : !order ? (
              <div className="text-slate-600">Order not found.</div>
            ) : (
              <>
                {/* Status tracker */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold text-slate-900">Status</div>
                    <div className="text-sm font-semibold text-slate-700">{statusLabel(curStatus)}</div>
                  </div>

                  {curStatus === "cancelled" ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
                      This order was cancelled.
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {steps.map((s, i) => {
                        const active = i <= curIdx;
                        return (
                          <div key={s} className="text-center">
                            <div
                              className={[
                                "h-2 rounded-full",
                                active ? "bg-green-600" : "bg-slate-200",
                              ].join(" ")}
                            />
                            <div className="mt-2 text-xs font-semibold text-slate-700">
                              {statusLabel(s)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Items</div>
                    <div className="text-xl font-bold text-slate-900">{itemsCount}</div>
                  </div>
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-xl font-bold text-green-700">{money(order.total)}</div>
                  </div>
                  <div className="rounded-2xl border bg-slate-50 p-4">
                    <div className="text-xs text-slate-500">Placed</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-2xl border p-4 mb-6">
                  <div className="text-sm font-bold text-slate-900">Delivery Address</div>
                  <div className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                    {order.address || "-"}
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-2xl border overflow-hidden">
                  <div className="p-4 border-b font-bold text-slate-900">Items</div>
                  <div className="overflow-auto">
                    <table className="min-w-[800px] w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-left">
                          <th className="p-3 font-semibold">Product</th>
                          <th className="p-3 font-semibold">SKU</th>
                          <th className="p-3 font-semibold">Price</th>
                          <th className="p-3 font-semibold">Qty</th>
                          <th className="p-3 font-semibold">Line Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.items || []).map((it: any, idx: number) => {
                          const qty = Number(it.qty || 0);
                          const price = Number(it.priceSnapshot || 0);
                          return (
                            <tr key={`${it.sku}-${idx}`} className="border-t">
                              <td className="p-3 font-semibold text-slate-900">{it.name || "-"}</td>
                              <td className="p-3">{it.sku || "-"}</td>
                              <td className="p-3">{money(price)}</td>
                              <td className="p-3">{qty}</td>
                              <td className="p-3 font-semibold text-green-700">{money(price * qty)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
