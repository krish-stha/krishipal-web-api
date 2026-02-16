"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import { cancelMyOrder, getMyOrderById } from "@/lib/api/order";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

function isValidObjectId(v: string) {
  return /^[a-fA-F0-9]{24}$/.test(v);
}

function statusLabel(s?: string) {
  const v = String(s || "").toLowerCase();
  if (!v) return "-";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();

  // ✅ robust: get first param value (works for [id], [orderId], etc)
  const id = useMemo(() => {
    const p: any = params || {};
    const firstKey = Object.keys(p)[0];
    const val = firstKey ? p[firstKey] : "";
    return Array.isArray(val) ? String(val[0] || "") : String(val || "");
  }, [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);

  const fetchOrder = async () => {
    if (!isValidObjectId(id)) {
      setError("Invalid order id in URL");
      setOrder(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await getMyOrderById(id);
      // API returns: { success: true, data: order }
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

  const subtotal = useMemo(() => Number(order?.subtotal || 0), [order]);
  const shipping = useMemo(() => Number(order?.shippingFee || 0), [order]);
  const total = useMemo(
    () => Number(order?.total || subtotal + shipping),
    [order, subtotal, shipping]
  );

  const currentStatus = String(order?.status || "").toLowerCase();

  const steps = ["pending", "confirmed", "shipped", "delivered"] as const;
  const activeIndex = Math.max(0, steps.indexOf(currentStatus as any));

  // ✅ UPDATED: ask reason + send it
  const onCancel = async () => {
    if (currentStatus !== "pending") return;

    const reason = (prompt("Cancel reason (optional):") || "").trim();

    if (!confirm("Cancel this order?")) return;

    setLoading(true);
    setError("");
    try {
      // ✅ send reason to backend
      const res = await cancelMyOrder(id, reason);

      // backend likely returns { success:true, data: order }
      // your cancelMyOrder returns res.data, so:
      setOrder(res?.data || null);

      // optional: refresh from server to be 100% sure
      // await fetchOrder();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Account / Orders / {id}</div>
          <h1 className="text-2xl font-bold text-slate-900">Track Order</h1>
          <p className="text-slate-600 mt-1">Order status + items snapshot.</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-slate-300"
            onClick={() => router.back()}
          >
            Back
          </Button>

          {/* ✅ Cancel only when pending */}
          {currentStatus === "pending" && (
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={onCancel}
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: status + items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl p-5">
            <div className="font-semibold text-slate-900 mb-3">Status</div>

            <div className="flex items-center gap-2">
              {steps.map((s, idx) => {
                const done = idx <= activeIndex;
                return (
                  <div key={s} className="flex-1">
                    <div className={`h-2 rounded-full ${done ? "bg-green-600" : "bg-slate-200"}`} />
                    <div className="text-xs text-center mt-2 text-slate-600">
                      {statusLabel(s)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-sm text-slate-600 mt-4">
              Current status: <b className="text-slate-900">{statusLabel(order?.status)}</b>
            </div>

            {currentStatus === "cancelled" && (
              <div className="text-sm text-red-600 mt-2 space-y-1">
                <div>This order has been cancelled.</div>

                {/* ✅ show reason if exists */}
                {order?.cancel_reason ? (
                  <div className="text-slate-700">
                    Reason: <b>{String(order.cancel_reason)}</b>
                  </div>
                ) : (
                  <div className="text-slate-500">Reason: -</div>
                )}
              </div>
            )}
          </Card>

          <Card className="rounded-2xl overflow-hidden">
            <div className="p-4 border-b">
              <div className="font-semibold text-slate-900">Items</div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[900px] w-full text-sm">
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
                  {loading ? (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  ) : (order?.items || []).length === 0 ? (
                    <tr>
                      <td className="p-4 text-slate-500" colSpan={5}>
                        No items
                      </td>
                    </tr>
                  ) : (
                    (order.items || []).map((it: any, idx: number) => {
                      const price = Number(it.priceSnapshot ?? 0);
                      const qty = Number(it.qty ?? 0);
                      const lineTotal = price * qty;

                      return (
                        <tr key={`${it?.sku || idx}`} className="border-t">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{it?.name || "-"}</div>
                            {it?.slug ? (
                              <Link
                                href={`/user/dashboard/shop/${it.slug}`}
                                className="text-xs text-slate-500 hover:underline"
                              >
                                /{it.slug}
                              </Link>
                            ) : (
                              <div className="text-xs text-slate-500">-</div>
                            )}
                          </td>
                          <td className="p-3">{it?.sku || "-"}</td>
                          <td className="p-3">{money(price)}</td>
                          <td className="p-3">{qty}</td>
                          <td className="p-3 font-semibold text-green-700">{money(lineTotal)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT: summary + address */}
        <div className="space-y-6">
          <Card className="rounded-2xl p-5">
            <div className="font-semibold text-slate-900 mb-3">Summary</div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{money(subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">{money(shipping)}</span>
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">{money(total)}</span>
            </div>

            <div className="text-xs text-slate-500 mt-4">
              Payment: <b className="text-slate-700">{String(order?.paymentMethod || "COD")}</b>
            </div>
          </Card>

          <Card className="rounded-2xl p-5">
            <div className="font-semibold text-slate-900 mb-3">Delivery Address</div>
            <div className="text-sm text-slate-700">{order?.address || "-"}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
