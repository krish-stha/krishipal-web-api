"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { useCart } from "@/lib/contexts/cart-context";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function productImageUrl(filename?: string | null) {
  if (!filename) return "/images/placeholder.png";
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
  return `${BACKEND_URL}/public/product_images/${filename}`;
}

export default function CartPage() {
  const { cart, count, loading, setQty, remove, clear } = useCart();
  const [busyId, setBusyId] = useState<string>("");

  const items = cart?.items || [];

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, it: any) => sum + Number(it.priceSnapshot || 0) * Number(it.qty || 0),
      0
    );
    const shipping = 0;
    const tax = 0;
    const grandTotal = subtotal + shipping + tax;
    return { subtotal, shipping, tax, grandTotal };
  }, [items]);

  const hasOutOfStock = useMemo(() => {
    return items.some((it: any) => Number(it?.product?.stock ?? 0) <= 0);
  }, [items]);

  const checkoutDisabled = loading || items.length === 0 || hasOutOfStock;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold">Shopping Cart</h1>
              <p className="text-gray-500 mt-2">Items: {count}</p>
            </div>

            {items.length > 0 && (
              <Button
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                onClick={() => clear()}
                disabled={loading}
              >
                Clear Cart
              </Button>
            )}
          </div>

          {loading && (
            <div className="rounded-2xl border bg-slate-50 p-8 text-slate-600">
              Loading cart...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
              <p className="text-gray-400">Add some products to get started!</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((it: any) => {
                  const p = it.product;
                  const id = String(p?._id || "");
                  const firstImage = Array.isArray(p?.images) ? p.images[0] : null;
                  const maxStock = Number(p?.stock ?? 0);

                  const qty = Number(it.qty || 1);
                  const price = Number(it.priceSnapshot || 0);
                  const lineTotal = price * qty;

                  return (
                    <div key={id} className="rounded-2xl border bg-white shadow-sm p-4">
                      <div className="flex gap-4">
                        <div className="h-24 w-24 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center">
                          <img
                            src={productImageUrl(firstImage)}
                            alt={p?.name || "Product"}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">
                                {p?.name}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                SKU: {p?.sku || "-"} • Category: {p?.category?.name || "-"}
                              </div>
                              <div className="text-sm text-green-700 font-bold mt-2">
                                Rs. {price}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Stock: {maxStock}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-slate-500">Total</div>
                              <div className="font-bold text-slate-900">Rs. {lineTotal}</div>
                            </div>
                          </div>

                          {/* Qty controls */}
                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                disabled={busyId === id || qty <= 1}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await setQty(id, qty - 1);
                                  } finally {
                                    setBusyId("");
                                  }
                                }}
                              >
                                -
                              </Button>

                              <div className="w-12 text-center font-semibold">{qty}</div>

                              <Button
                                variant="outline"
                                disabled={busyId === id || qty >= maxStock || maxStock === 0}
                                onClick={async () => {
                                  setBusyId(id);
                                  try {
                                    await setQty(id, qty + 1);
                                  } finally {
                                    setBusyId("");
                                  }
                                }}
                              >
                                +
                              </Button>
                            </div>

                            <Button
                              variant="outline"
                              className="border-red-500 text-red-600 hover:bg-red-50"
                              disabled={busyId === id}
                              onClick={async () => {
                                setBusyId(id);
                                try {
                                  await remove(id);
                                } finally {
                                  setBusyId("");
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>

                          {maxStock === 0 && (
                            <div className="mt-3 text-sm text-red-600">
                              This product is out of stock now. Please remove it.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: summary */}
              <div className="rounded-2xl border bg-white shadow-sm p-6 h-fit">
                <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold">Rs. {totals.subtotal}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold">Rs. {totals.shipping}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Tax</span>
                    <span className="font-semibold">Rs. {totals.tax}</span>
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="text-slate-900 font-bold">Total</span>
                    <span className="text-slate-900 font-bold">Rs. {totals.grandTotal}</span>
                  </div>
                </div>

                <Link
                  href="/user/dashboard/checkout"
                  className={checkoutDisabled ? "pointer-events-none" : ""}
                >
                  <Button
                    className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    disabled={checkoutDisabled}
                  >
                    Proceed to Checkout
                  </Button>
                </Link>

                {hasOutOfStock ? (
                  <p className="mt-3 text-xs text-red-600">
                    Remove out-of-stock items to continue checkout.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-slate-400">
                    Checkout will validate stock again before placing the order.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
