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

function StatusPill({ status }: { status?: string }) {
  const s = String(status || "pending").toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset";
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
    shipped: "bg-purple-50 text-purple-700 ring-purple-200",
    delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return <span className={`${base} ${map[s] || "bg-slate-50 text-slate-700 ring-slate-200"}`}>{s}</span>;
}

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

  const userName =
    order?.user?.fullName || (order?.user?.email ? String(order.user.email).split("@")[0] : "-");
  const userEmail = order?.user?.email || "-";
  const address = order?.address || order?.user?.address || "-";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Top Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs text-slate-500">Admin / Orders / {id}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order Detail</h1>
              <StatusPill status={order?.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              User: <b className="text-slate-900">{userName}</b>{" "}
              <span className="text-slate-400">•</span> {userEmail}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-300 bg-white hover:bg-slate-100"
              onClick={() => router.push("/admin/orders")}
            >
              Back
            </Button>

            <Button
              variant="outline"
              className="border-slate-300 bg-white hover:bg-slate-100"
              onClick={fetchOrder}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Items */}
          <div className="lg:col-span-2">
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Items</div>
                  <div className="text-xs text-slate-500">
                    {itemsCount} item{itemsCount === 1 ? "" : "s"} in this order
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    Total: {money(order?.total)}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="p-3 sm:p-4 font-semibold">Product</th>
                      <th className="p-3 sm:p-4 font-semibold">SKU</th>
                      <th className="p-3 sm:p-4 font-semibold">Price</th>
                      <th className="p-3 sm:p-4 font-semibold">Qty</th>
                      <th className="p-3 sm:p-4 font-semibold">Line Total</th>
                    </tr>
                  </thead>

                  <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
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
                          <tr key={`${String(it.product)}-${idx}`} className="border-t border-slate-200">
                            <td className="p-3 sm:p-4">
                              <div className="font-semibold text-slate-900">{it.name || "-"}</div>
                              <div className="mt-0.5 text-xs text-slate-500">Slug: {it.slug || "-"}</div>
                            </td>
                            <td className="p-3 sm:p-4 text-slate-700">{it.sku || "-"}</td>
                            <td className="p-3 sm:p-4 text-slate-700">{money(price)}</td>
                            <td className="p-3 sm:p-4 text-slate-700">{qty}</td>
                            <td className="p-3 sm:p-4 font-semibold text-emerald-700">{money(line)}</td>
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
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">Summary</div>
                <div className="text-xs text-slate-500">Order #{String(order?._id || "-").slice(-8)}</div>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">{money(order?.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium text-slate-900">{money(order?.shippingFee)}</span>
                </div>

                <div className="h-px bg-slate-200 my-2" />

                <div className="flex justify-between text-base">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-semibold text-slate-900">{money(order?.total)}</span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs text-slate-500">Payment</div>
                    <div className="mt-1 font-medium text-slate-900">{order?.paymentMethod || "COD"}</div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs text-slate-500">Delivery Address</div>
                    <div className="mt-1 font-medium text-slate-900 whitespace-pre-wrap">{address}</div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                    <div className="text-xs text-slate-500">Created</div>
                    <div className="mt-1 font-medium text-slate-900">
                      {order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">Status</div>
                <StatusPill status={order?.status} />
              </div>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Update status</span>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="w-full h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none shadow-sm focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
                  >
                    {STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                  onClick={onSaveStatus}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Status"}
                </Button>

                <div className="text-xs text-slate-500">
                  Current: <b className="text-slate-900">{order?.status || "-"}</b>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
