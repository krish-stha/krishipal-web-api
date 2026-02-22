"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { Card } from "@/app/auth/components/ui/card";
import { useCart } from "@/lib/contexts/cart-context";
import { createOrder } from "@/lib/api/order";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, refresh } = useCart();

  const items = cart?.items || [];
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum: number, it: any) => sum + Number(it.priceSnapshot || 0) * Number(it.qty || 0),
      0
    );
  }, [items]);

  const hasOutOfStock = useMemo(() => {
    return items.some((it: any) => Number(it?.product?.stock ?? 0) <= 0);
  }, [items]);

  const placeOrder = async () => {
    setError("");
    if (!address.trim()) {
      setError("Address is required.");
      return;
    }
    if (items.length === 0) {
      setError("Cart is empty.");
      return;
    }
    if (hasOutOfStock) {
      setError("Remove out-of-stock items to continue.");
      return;
    }

    setBusy(true);
    try {
      const res = await createOrder({ address: address.trim(), paymentMethod: "COD" });

      // backend response: { success:true, data: createdOrder }
      const orderId = res?.data?._id || res?.data?.id || res?.data?._id;

      await refresh(); // cart cleared in backend, reflect in UI

      if (orderId) router.push(`/user/dashboard/orders/${orderId}`);
      else router.push("/user/dashboard/orders");
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
            <p className="text-slate-600 mt-1">Cash on Delivery (COD) — for now.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="rounded-2xl p-5">
                <div className="font-semibold text-slate-900">Delivery Address</div>
                <p className="text-sm text-slate-600 mt-1">
                  Enter the full address where you want your order delivered.
                </p>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={5}
                  className="mt-4 w-full rounded-xl border bg-white p-3 outline-none focus:ring-2 focus:ring-green-200"
                  placeholder="Eg: Jhapa, Birtamode-05, near ... Phone: 98xxxxxxxx"
                />

                {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

                <div className="mt-5 flex gap-2">
                  <Button
                    variant="outline"
                    className="border-slate-300"
                    onClick={() => router.push("/user/dashboard/cart")}
                    disabled={busy}
                  >
                    Back to Cart
                  </Button>

                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={placeOrder}
                    disabled={busy || loading}
                  >
                    {busy ? "Placing..." : "Place Order (COD)"}
                  </Button>
                </div>
              </Card>
            </div>

            <div>
              <Card className="rounded-2xl p-5">
                <div className="font-semibold text-slate-900">Summary</div>

                <div className="mt-4 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Items</span>
                    <span className="font-semibold">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold">Rs. {subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold">Rs. 0</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-slate-900 font-bold">Total</span>
                    <span className="text-slate-900 font-bold">Rs. {subtotal}</span>
                  </div>
                </div>

                {hasOutOfStock && (
                  <div className="mt-4 text-xs text-red-600">
                    Your cart contains out-of-stock items. Please remove them before checkout.
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
