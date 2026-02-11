"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/app/auth/components/ui/card";
import { Button } from "@/app/auth/components/ui/button";
import {
  adminClearCart,
  adminDeleteCart,
  adminGetCartById,
  adminRemoveCartItem,
  adminSetCartItemQty,
} from "@/lib/api/admin/cart";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

export default function AdminCartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<any>(null);

  const fetchCart = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminGetCartById(id);
      setCart(res.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load cart");
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const subtotal = useMemo(() => {
    const items = cart?.items || [];
    return items.reduce((sum: number, it: any) => {
      const p = it.product || {};
      const snap = Number(it.priceSnapshot ?? 0);
const price =
  snap > 0
    ? snap
    : p.discountPrice !== null && p.discountPrice !== undefined
    ? Number(p.discountPrice)
    : Number(p.price || 0);

      return sum + price * Number(it.qty || 0);
    }, 0);
  }, [cart]);

  const userName = cart?.user?.fullName || (cart?.user?.email ? String(cart.user.email).split("@")[0] : "-");
  const userEmail = cart?.user?.email || "-";

  const onSetQty = async (productId: string, qty: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminSetCartItemQty(id, productId, qty);
      setCart(res.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to update qty");
    } finally {
      setLoading(false);
    }
  };

  const onRemove = async (productId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminRemoveCartItem(id, productId);
      setCart(res.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const onClear = async () => {
    if (!confirm("Clear this cart?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminClearCart(id);
      setCart(res.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteCart = async () => {
    if (!confirm("Delete this cart document?")) return;
    setLoading(true);
    setError("");
    try {
      await adminDeleteCart(id);
      router.push("/admin/cart");
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to delete cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="text-sm text-slate-500">Admin / Cart / {id}</div>
        <h1 className="text-2xl font-bold text-slate-900">Cart Detail</h1>
        <p className="text-slate-600 mt-1">
          User: <b className="text-slate-900">{userName}</b> ({userEmail})
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" className="border-slate-300" onClick={() => router.push("/admin/cart")}>
          Back
        </Button>
        <Button variant="outline" className="border-slate-300" onClick={onClear} disabled={loading}>
          Clear Cart
        </Button>
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onDeleteCart} disabled={loading}>
          Delete Cart
        </Button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <Card className="rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">Items</div>
          <div className="font-semibold text-green-700">Subtotal: {money(subtotal)}</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold">Qty</th>
                <th className="p-3 font-semibold">Line Total</th>
                <th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : (cart?.items || []).length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={6}>
                    No items in this cart
                  </td>
                </tr>
              ) : (
                (cart.items || []).map((it: any) => {
                  const p = it.product || {};
                  const category = p.category?.name || "-";
                  const price =
                    p.discountPrice !== null && p.discountPrice !== undefined ? Number(p.discountPrice) : Number(p.price || 0);
                  const qty = Number(it.qty || 0);
                  const lineTotal = price * qty;

                  return (
                    <tr key={String(p._id)} className="border-t">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{p.name || "-"}</div>
                        <div className="text-xs text-slate-500">SKU: {p.sku || "-"}</div>
                      </td>
                      <td className="p-3">{category}</td>
                      <td className="p-3">{money(price)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            defaultValue={qty}
                            className="w-24 h-9 rounded-lg border px-2"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const v = Number((e.target as HTMLInputElement).value);
                                onSetQty(String(p._id), v);
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            className="border-slate-300 h-9"
                            onClick={() => {
                              const input = (document.activeElement as HTMLInputElement);
                              const v = Number((input?.value ?? qty));
                              onSetQty(String(p._id), v);
                            }}
                          >
                            Save
                          </Button>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Press Enter or Save</div>
                      </td>
                      <td className="p-3 font-semibold text-green-700">{money(lineTotal)}</td>
                      <td className="p-3 text-right">
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => onRemove(String(p._id))}
                          disabled={loading}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
