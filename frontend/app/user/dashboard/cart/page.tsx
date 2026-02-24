"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/app/user/component/header";
import { Footer } from "@/app/user/component/footer";
import { Button } from "@/app/auth/components/ui/button";
import { useCart } from "@/lib/contexts/cart-context";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

function productImageUrl(filename?: string | null) {
  if (!filename) return "/images/placeholder.png";
  return `${BACKEND_URL}/public/product_images/${filename}`;
}

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

// supports both populated product and plain string id
function getPid(it: any) {
  return String(it?.product?._id || it?.product || "");
}

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    count,
    loading,
    setQty,
    remove,
    clear,

    // ✅ selection features
    selectedIds,
    isSelected,
    toggleSelected,
    selectAll,
    clearSelection,
  } = useCart();

  const [busyId, setBusyId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const items = cart?.items || [];

  const selectedItems = useMemo(() => {
    const set = new Set(selectedIds.map(String));
    return items.filter((it: any) => {
      const pid = getPid(it);
      return pid && set.has(pid);
    });
  }, [items, selectedIds]);

  const totals = useMemo(() => {
    // ✅ totals for selected items only
    const subtotal = selectedItems.reduce(
      (sum, it: any) => sum + Number(it.priceSnapshot || 0) * Number(it.qty || 0),
      0
    );
    const shipping = 0;
    const tax = 0;
    const grandTotal = subtotal + shipping + tax;
    return { subtotal, shipping, tax, grandTotal };
  }, [selectedItems]);

  const hasOutOfStockSelected = useMemo(() => {
    return selectedItems.some((it: any) => Number(it?.product?.stock ?? 0) <= 0);
  }, [selectedItems]);

  const onCheckout = () => {
    setError("");
    if (items.length === 0) return setError("Your cart is empty.");
    if (selectedItems.length === 0) return setError("Tick at least 1 item to checkout.");
    if (hasOutOfStockSelected) return setError("Untick/remove out-of-stock selected items first.");
    router.push("/user/dashboard/checkout");
  };

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

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

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
                {/* ✅ selection toolbar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-600">
                    Selected: <b className="text-slate-900">{selectedItems.length}</b>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-slate-300"
                      onClick={selectAll}
                      disabled={items.length === 0}
                    >
                      Select all
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-300"
                      onClick={clearSelection}
                      disabled={selectedIds.length === 0}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>

                {items.map((it: any, idx: number) => {
                  const p = it.product;
                  const id = getPid(it) || `row_${idx}`;
                  const firstImage = Array.isArray(p?.images) ? p.images[0] : null;
                  const maxStock = Number(p?.stock ?? 0);

                  const qty = Number(it.qty || 1);
                  const price = Number(it.priceSnapshot || 0);
                  const lineTotal = price * qty;

                  const checked = id !== `row_${idx}` ? isSelected(id) : false;

                  return (
                    <div key={id} className="rounded-2xl border bg-white shadow-sm p-4">
                      <div className="flex gap-4">
                        {/* ✅ tick/untick */}
                        <div className="pt-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={() => {
                              if (id !== `row_${idx}`) toggleSelected(id);
                            }}
                          />
                        </div>

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
                              <div className="font-semibold text-slate-900 truncate">{p?.name}</div>
                              <div className="text-xs text-slate-500 mt-1">
                                SKU: {p?.sku || "-"} • Category: {p?.category?.name || "-"}
                              </div>
                              <div className="text-sm text-green-700 font-bold mt-2">
                                {money(price)}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">Stock: {maxStock}</div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-slate-500">Total</div>
                              <div className="font-bold text-slate-900">{money(lineTotal)}</div>
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
                                disabled={busyId === id || qty >= maxStock}
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

                          {maxStock === 0 && checked && (
                            <div className="mt-3 text-sm text-red-600">
                              This selected product is out of stock. Untick it or remove it.
                            </div>
                          )}

                          {maxStock === 0 && !checked && (
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

                <div className="mt-3 text-sm text-slate-600">
                  Selected items: <b className="text-slate-900">{selectedItems.length}</b>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold">{money(totals.subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-semibold">{money(totals.shipping)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Tax</span>
                    <span className="font-semibold">{money(totals.tax)}</span>
                  </div>

                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="text-slate-900 font-bold">Total</span>
                    <span className="text-slate-900 font-bold">{money(totals.grandTotal)}</span>
                  </div>
                </div>

                <Button
                  className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading || items.length === 0}
                  onClick={onCheckout}
                >
                  Proceed to Checkout
                </Button>

                {hasOutOfStockSelected && (
                  <p className="mt-3 text-xs text-red-500">
                    Some selected items are out of stock. Untick them or remove them.
                  </p>
                )}

                {selectedItems.length === 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    Tip: tick items to checkout. Unticked items stay in cart.
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