"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import { getMyOrderById } from "@/lib/api/order";

function statusStep(status: string) {
  const steps = ["pending", "confirmed", "shipped", "delivered"];
  const idx = steps.indexOf(status);
  return idx === -1 ? 0 : idx;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any)?.id || "");

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

  const s = String(order?.status || "pending");
  const step = statusStep(s);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">Account / Orders / {id}</div>
              <h1 className="text-3xl font-bold text-slate-900">Track Order</h1>
              <p className="text-slate-600 mt-1">Order status + items snapshot.</p>
            </div>

            <Button variant="outline" className="border-slate-300" onClick={() => router.push("/user/dashboard/orders")}>
              Back
            </Button>
          </div>

          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="rounded-2xl p-5">
                <div className="font-semibold text-slate-900">Status</div>

                {loading ? (
                  <div className="mt-3 text-slate-600">Loading...</div>
                ) : !order ? (
                  <div className="mt-3 text-slate-600">No order data.</div>
                ) : (
                  <>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {["pending", "confirmed", "shipped", "delivered"].map((st, i) => (
                        <div key={st} className="text-center">
                          <div
                            className={[
                              "h-2 rounded-full",
                              i <= step ? "bg-green-600" : "bg-slate-200",
                            ].join(" ")}
                          />
                          <div className="mt-2 text-xs font-semibold text-slate-700 capitalize">{st}</div>
                        </div>
                      ))}
                    </div>

                    {s === "cancelled" && (
                      <div className="mt-4 text-sm text-red-600 font-semibold">
                        This order is cancelled.
                      </div>
                    )}

                    <div className="mt-4 text-sm text-slate-600">
                      Current status: <b className="text-slate-900 capitalize">{s}</b>
                    </div>
                  </>
                )}
              </Card>

              <Card className="rounded-2xl overflow-hidden">
                <div className="p-4 border-b font-semibold text-slate-900">Items</div>

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
                          const price = Number(it.priceSnapshot || 0);
                          const qty = Number(it.qty || 0);
                          return (
                            <tr key={idx} className="border-t">
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{it.name}</div>
                                <div className="text-xs text-slate-500">/{it.slug}</div>
                              </td>
                              <td className="p-3 text-slate-600">{it.sku}</td>
                              <td className="p-3">Rs. {price}</td>
                              <td className="p-3">{qty}</td>
                              <td className="p-3 font-semibold text-green-700">Rs. {price * qty}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="rounded-2xl p-5">
                <div className="font-semibold text-slate-900">Summary</div>

                <div className="mt-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold">Rs. {order?.subtotal ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold">Rs. {order?.shippingFee ?? 0}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-slate-900 font-bold">Total</span>
                    <span className="text-slate-900 font-bold">Rs. {order?.total ?? 0}</span>
                  </div>
                </div>

                <div className="mt-4 text-xs text-slate-500">
                  Payment: <b className="text-slate-700">{order?.paymentMethod || "COD"}</b>
                </div>
              </Card>

              <Card className="rounded-2xl p-5">
                <div className="font-semibold text-slate-900">Delivery Address</div>
                <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                  {order?.address || "-"}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
