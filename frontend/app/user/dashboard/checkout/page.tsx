"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { Card } from "@/app/auth/components/ui/card";
import { useCart } from "@/lib/contexts/cart-context";
import { createOrder } from "@/lib/api/order";
import { getPublicSettings } from "@/lib/api/settings";
import { initiateKhaltiPayment } from "@/lib/api/payment";

type PaymentMethod = "COD" | "KHALTI" | "ESEWA";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

// ✅ helper: supports both populated product object and plain productId string
function getPid(it: any) {
  return String(it?.product?._id || it?.product || "");
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, refresh, selectedIds, isSelected, toggleSelected, selectAll } = useCart();

  const items = cart?.items || [];
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [settings, setSettings] = useState<any>(null);
  const [pay, setPay] = useState<PaymentMethod>("COD");

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicSettings();
        const s = res?.data || null;
        setSettings(s);

        // pick first enabled payment as default
        const p = s?.payments || {};
        const firstEnabled: PaymentMethod | null = p.COD ? "COD" : p.KHALTI ? "KHALTI" : p.ESEWA ? "ESEWA" : null;
        if (firstEnabled) setPay(firstEnabled);
      } catch {
        // fallback (don’t block checkout)
        setSettings({
          shippingFeeDefault: 0,
          freeShippingThreshold: null,
          payments: { COD: true, KHALTI: true, ESEWA: true },
        });
      }
    })();
  }, []);

  const selectedItems = useMemo(() => {
    const set = new Set(selectedIds.map(String));
    return items.filter((it: any) => {
      const pid = getPid(it);
      return pid && set.has(pid);
    });
  }, [items, selectedIds]);

  const selectedProductIds = useMemo(() => {
    return selectedItems.map((it: any) => getPid(it)).filter(Boolean);
  }, [selectedItems]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum: number, it: any) => sum + Number(it.priceSnapshot || 0) * Number(it.qty || 0), 0);
  }, [selectedItems]);

  const hasOutOfStock = useMemo(() => {
    return selectedItems.some((it: any) => Number(it?.product?.stock ?? 0) <= 0);
  }, [selectedItems]);

  const shippingFee = useMemo(() => {
    const def = Number(settings?.shippingFeeDefault ?? 0);
    const thrRaw = settings?.freeShippingThreshold;
    const thr = thrRaw === null || thrRaw === undefined ? null : Number(thrRaw);

    let fee = Math.max(0, def);
    if (thr !== null && Number.isFinite(thr) && subtotal >= thr) fee = 0;
    return fee;
  }, [settings, subtotal]);

  const total = subtotal + shippingFee;

  const payments = settings?.payments || { COD: true, KHALTI: true, ESEWA: true };

  const placeOrder = async () => {
    setError("");

    if (!address.trim()) return setError("Address is required.");
    if (items.length === 0) return setError("Cart is empty.");
    if (selectedItems.length === 0) return setError("Select at least 1 item to checkout.");
    if (hasOutOfStock) return setError("Remove out-of-stock selected items to continue.");

    // final safety check
    if ((pay === "COD" && !payments.COD) || (pay === "KHALTI" && !payments.KHALTI) || (pay === "ESEWA" && !payments.ESEWA)) {
      return setError("Selected payment method is disabled.");
    }

    setBusy(true);
    try {
      // ✅ IMPORTANT: send selectedProductIds
      const res = await createOrder({
        address: address.trim(),
        paymentMethod: pay,
        selectedProductIds,
      });

      // your API returns { success, data }
      const order = res?.data ?? res;
      const orderId = order?._id || order?.id;

      await refresh();

      if (!orderId) {
        router.push("/user/dashboard/orders");
        return;
      }

      // if online payment selected, go straight to payment flow
      if (pay === "KHALTI") {
        const p = await initiateKhaltiPayment(orderId);
        const paymentUrl = p?.data?.payment_url; // because your API returns { success, data: {...} }
        if (!paymentUrl) throw new Error("No payment_url received");
        window.location.href = paymentUrl;
        return;
      }

      if (pay === "ESEWA") {
        router.push(`/payments/esewa/redirect?orderId=${orderId}`);
        return;
      }

      router.push(`/user/dashboard/orders/${orderId}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-6">
            <div className="text-sm text-slate-500">Shop / Checkout</div>
            <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
            <p className="text-slate-600 mt-1">Tick items you want to checkout. Unticked items stay in cart.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-2 space-y-4">
              {/* ✅ Select Items */}
              <Card className="rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">Select items</div>
                  <Button
                    variant="outline"
                    className="border-slate-300 h-9"
                    onClick={selectAll}
                    disabled={items.length === 0}
                  >
                    Select all
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {items.length === 0 ? (
                    <div className="text-sm text-slate-500">Cart is empty.</div>
                  ) : (
                    items.map((it: any, idx: number) => {
                      const pid = getPid(it) || `row_${idx}`;
                      const name = String(it?.product?.name || "Product");
                      const stock = Number(it?.product?.stock ?? 0);
                      const checked = pid !== `row_${idx}` ? isSelected(pid) : false;

                      return (
                        <div key={pid} className="flex items-start gap-3 rounded-xl border bg-white p-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4"
                            checked={checked}
                            onChange={() => {
                              if (pid !== `row_${idx}`) toggleSelected(pid);
                            }}
                          />

                          <div className="flex-1">
                            <div className="font-semibold text-slate-900">{name}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              Qty: <b className="text-slate-900">{Number(it?.qty ?? 0)}</b> · Price:{" "}
                              <b className="text-slate-900">{money(it?.priceSnapshot)}</b> · Stock:{" "}
                              <b className={stock <= 0 ? "text-red-600" : "text-slate-900"}>{stock}</b>
                            </div>
                          </div>

                          <div className="text-sm font-bold text-slate-900">
                            {money(Number(it?.priceSnapshot || 0) * Number(it?.qty || 0))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Address + Payment */}
              <Card className="rounded-2xl p-5">
                <div className="font-semibold text-slate-900">Delivery Address</div>
                <p className="text-sm text-slate-600 mt-1">Enter the full address where you want your order delivered.</p>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={5}
                  className="mt-4 w-full rounded-xl border bg-white p-3 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Eg: Jhapa, Birtamode-05, near ... Phone: 98xxxxxxxx"
                />

                <div className="mt-5">
                  <div className="font-semibold text-slate-900">Payment Method</div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    {payments.COD && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="pay" checked={pay === "COD"} onChange={() => setPay("COD")} />
                        COD
                      </label>
                    )}
                    {payments.KHALTI && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="pay" checked={pay === "KHALTI"} onChange={() => setPay("KHALTI")} />
                        Khalti
                      </label>
                    )}
                    {payments.ESEWA && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="pay" checked={pay === "ESEWA"} onChange={() => setPay("ESEWA")} />
                        eSewa
                      </label>
                    )}

                    {!payments.COD && !payments.KHALTI && !payments.ESEWA && (
                      <div className="text-xs text-rose-600">No payment methods enabled (admin settings).</div>
                    )}
                  </div>
                </div>

                {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

                <div className="mt-5 flex gap-2">
                  <Button variant="outline" className="border-slate-300" onClick={() => router.push("/user/dashboard/cart")} disabled={busy}>
                    Back to Cart
                  </Button>

                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={placeOrder}
                    disabled={busy || loading || selectedItems.length === 0 || (!payments.COD && !payments.KHALTI && !payments.ESEWA)}
                  >
                    {busy ? "Placing..." : `Place Order (${pay})`}
                  </Button>
                </div>
              </Card>
            </div>

            {/* RIGHT SUMMARY */}
            <div>
              <Card className="rounded-2xl p-5">
                <div className="font-semibold text-slate-900">Summary</div>

                <div className="mt-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Selected items</span>
                    <span className="font-semibold">{selectedItems.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold">{money(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold">{money(shippingFee)}</span>
                  </div>

                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-slate-900 font-bold">Total</span>
                    <span className="text-slate-900 font-bold">{money(total)}</span>
                  </div>
                </div>

                {settings?.freeShippingThreshold !== null && settings?.freeShippingThreshold !== undefined && (
                  <div className="mt-3 text-xs text-slate-500">
                    Free shipping over: <b>Rs. {Number(settings.freeShippingThreshold)}</b>
                  </div>
                )}

                {hasOutOfStock && (
                  <div className="mt-4 text-xs text-red-600">
                    Selected items contain out-of-stock products. Untick them or remove from cart.
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}