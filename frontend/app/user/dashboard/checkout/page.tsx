"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { useCart } from "@/lib/contexts/cart-context";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";
import { createOrder } from "@/lib/api/order";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading, refresh } = useCart();

  const items = cart?.items || [];

  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD">("COD");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string>("");

  const hasOutOfStock = useMemo(() => {
    return items.some((it: any) => Number(it?.product?.stock ?? 0) <= 0);
  }, [items]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, it: any) => sum + Number(it.priceSnapshot || 0) * Number(it.qty || 0),
      0
    );
    const shippingFee = 0;
    const total = subtotal + shippingFee;
    return { subtotal, shippingFee, total };
  }, [items]);

  // load default address from /auth/me
  useEffect(() => {
    (async () => {
      try {
        const meRes = await api.get(endpoints.auth.me);
        const me = meRes?.data?.data ?? meRes?.data;
        const a = String(me?.address ?? "").trim();
        if (a) setAddress(a);
      } catch {
        // ignore
      }
    })();
  }, []);

  // guard: if cart empty redirect
  useEffect(() => {
    if (!cartLoading && items.length === 0) {
      router.push("/user/dashboard/cart");
    }
  }, [cartLoading, items.length, router]);

  const onConfirm = async () => {
    setError("");

    if (!address.trim()) {
      setError("Please enter delivery address.");
      return;
    }
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }
    if (hasOutOfStock) {
      setError("Remove out-of-stock items to continue.");
      return;
    }

    setPlacing(true);
    try {
      const res = await createOrder({ address: address.trim(), paymentMethod: "COD" });

      // refresh cart (should be cleared)
      await refresh();

      // You can create a success page later; for now go back to shop
      // or show a toast. We'll redirect to cart (empty) to show success feel.
      router.push("/user/dashboard/cart");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="mb-8">
            <div className="text-sm text-slate-500">Checkout</div>
            <h1 className="text-3xl font-bold text-slate-900">Confirm your order</h1>
            <p className="text-slate-600 mt-1">
              Address, payment method, and final confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border bg-white shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900">Delivery Address</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Using your profile address as default. You can edit it here for this order.
                </p>

                <textarea
                  className="mt-4 w-full rounded-xl border bg-white p-3 outline-none focus:ring-2 focus:ring-green-200"
                  rows={4}
                  placeholder="Enter delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="rounded-2xl border bg-white shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900">Payment Method</h2>
                <div className="mt-4">
                  <label className="flex items-center gap-3 rounded-xl border p-3 cursor-pointer">
                    <input
                      type="radio"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                    />
                    <div>
                      <div className="font-semibold text-slate-900">Cash on Delivery (COD)</div>
                      <div className="text-xs text-slate-500">Pay when your order arrives.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border bg-white shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900">Items</h2>

                {cartLoading ? (
                  <div className="mt-4 text-slate-600">Loading cart...</div>
                ) : items.length === 0 ? (
                  <div className="mt-4 text-slate-600">No items in cart.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {items.map((it: any) => {
                      const p = it.product || {};
                      const name = p?.name || "Product";
                      const qty = Number(it.qty || 0);
                      const price = Number(it.priceSnapshot || 0);

                      return (
                        <div
                          key={String(p._id || Math.random())}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{name}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              Qty: {qty} • Price: {money(price)} • Stock: {Number(p.stock ?? 0)}
                            </div>
                          </div>
                          <div className="font-bold text-slate-900">{money(qty * price)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hasOutOfStock && (
                  <div className="mt-4 text-sm text-red-600">
                    Some items are out of stock. Go back to cart and remove them.
                  </div>
                )}
              </div>
            </div>

            {/* Right summary */}
            <div className="rounded-2xl border bg-white shadow-sm p-6 h-fit">
              <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">{money(totals.subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Delivery</span>
                  <span className="font-semibold">{money(totals.shippingFee)}</span>
                </div>

                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-slate-900 font-bold">Total</span>
                  <span className="text-slate-900 font-bold">{money(totals.total)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                onClick={onConfirm}
                disabled={placing || cartLoading || items.length === 0 || hasOutOfStock}
              >
                {placing ? "Placing Order..." : "Confirm Order"}
              </Button>

              <Button
                variant="outline"
                className="mt-3 w-full border-slate-300"
                onClick={() => router.push("/user/dashboard/cart")}
                disabled={placing}
              >
                Back to Cart
              </Button>

              <p className="mt-3 text-xs text-slate-400">
                Stock is validated again on the server before order creation.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
