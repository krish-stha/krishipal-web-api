"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import { adminGetOrderById, adminUpdateOrderStatus } from "@/lib/api/admin/order";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

const STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);

  const [nextStatus, setNextStatus] = useState<string>("pending");

  const fetchOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminGetOrderById(id);
      const data = res.data?.data || null;
      setOrder(data);
      setNextStatus(String(data?.status || "pending"));
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

  const onSaveStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminUpdateOrderStatus(id, nextStatus);
      setOrder(res.data?.data || order);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const userName = order?.user?.fullName || (order?.user?.email ? String(order.user.email).split("@")[0] : "-");
  const userEmail = order?.user?.email || "-";
  const address = order?.address || order?.user?.address || "-";

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="text-sm text-slate-500">Admin / Orders / {id}</div>
        <h1 className="text-2xl font-bold text-slate-900">Order Detail</h1>
        <p className="text-slate-600 mt-1">
          User: <b className="text-slate-900">{userName}</b> ({userEmail})
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" className="border-slate-300" onClick={() => router.push("/admin/orders")}>
          Back
        </Button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Items */}
        <div className="md:col-span-2">
          <Card className="rounded-2xl overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold text-slate-900">Items ({itemsCount})</div>
              <div className="font-semibold text-green-700">Total: {money(order?.total)}</div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="p-3 font-semibold">Product</th>
                    <th className="p-3 font-semibold">SKU</th>
                    <th className="p-3 font-semibold">Price Snapshot</th>
                    <th className="p-3 font-semibold">Qty</th>
                    <th className="p-3 font-semibold">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={5}>
                        No items in this order
                      </td>
                    </tr>
                  ) : (
                    items.map((it: any, idx: number) => {
                      const qty = Number(it.qty || 0);
                      const price = Number(it.priceSnapshot || 0);
                      const line = qty * price;

                      return (
                        <tr key={`${String(it.product)}-${idx}`} className="border-t">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{it.name || "-"}</div>
                            <div className="text-xs text-slate-500">Slug: {it.slug || "-"}</div>
                          </td>
                          <td className="p-3">{it.sku || "-"}</td>
                          <td className="p-3">{money(price)}</td>
                          <td className="p-3">{qty}</td>
                          <td className="p-3 font-semibold text-green-700">{money(line)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right: Summary + Status */}
        <div className="space-y-6">
          <Card className="rounded-2xl p-4">
            <div className="font-semibold text-slate-900 mb-2">Summary</div>

            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">{money(order?.subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="font-medium">{money(order?.shippingFee)}</span>
              </div>

              <div className="border-t my-2" />

              <div className="flex justify-between text-base">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{money(order?.total)}</span>
              </div>

              <div className="mt-3">
                <div className="text-slate-600 text-xs mb-1">Payment</div>
                <div className="font-medium">{order?.paymentMethod || "COD"}</div>
              </div>

              <div className="mt-3">
                <div className="text-slate-600 text-xs mb-1">Delivery Address</div>
                <div className="font-medium whitespace-pre-wrap">{address}</div>
              </div>

              <div className="mt-3">
                <div className="text-slate-600 text-xs mb-1">Created</div>
                <div className="font-medium">
                  {order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl p-4">
            <div className="font-semibold text-slate-900 mb-3">Status</div>

            <div className="space-y-3">
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="w-full h-10 rounded-xl border bg-white px-3 outline-none focus:ring-2 focus:ring-green-200"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={onSaveStatus}
                disabled={loading}
              >
                Save Status
              </Button>

              <div className="text-xs text-slate-500">
                Current: <b className="text-slate-900">{order?.status || "-"}</b>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
