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
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/app/auth/components/ui/confirm-dialog";

function money(n: any) {
  const v = Number(n ?? 0);
  return `Rs. ${Number.isFinite(v) ? v : 0}`;
}

function isValidObjectId(v: string) {
  return /^[a-fA-F0-9]{24}$/.test(v);
}

export default function AdminCartDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  // ✅ get the first param value no matter what the folder name is
  const id = useMemo(() => {
    const p: any = params || {};
    const firstKey = Object.keys(p)[0];
    const val = firstKey ? p[firstKey] : "";
    return Array.isArray(val) ? String(val[0] || "") : String(val || "");
  }, [params]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cart, setCart] = useState<any>(null);

  // dialogs
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeName, setRemoveName] = useState<string>("");
  const [clearOpen, setClearOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchCart = async () => {
    if (!isValidObjectId(id)) {
      setError("Invalid cart id in URL");
      setCart(null);
      return;
    }

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

  const userName =
    cart?.user?.fullName ||
    (cart?.user?.email ? String(cart.user.email).split("@")[0] : "-");
  const userEmail = cart?.user?.email || "-";

  const onSetQty = async (productId: string, qty: number) => {
    const safeQty = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;

    setLoading(true);
    setError("");
    try {
      const res = await adminSetCartItemQty(id, productId, safeQty);
      setCart(res.data?.data || null);
      toast({
        title: "Updated",
        description: `Quantity set to ${safeQty}`,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update qty";
      setError(msg);
      toast({
        title: "Update failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRemove = async () => {
    if (!removeId) return;

    setLoading(true);
    setError("");
    try {
      const res = await adminRemoveCartItem(id, removeId);
      setCart(res.data?.data || null);
      toast({
        title: "Removed",
        description: removeName ? `${removeName} removed from cart` : "Item removed",
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to remove item";
      setError(msg);
      toast({
        title: "Remove failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRemoveId(null);
      setRemoveName("");
    }
  };

  const onClear = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminClearCart(id);
      setCart(res.data?.data || null);
      toast({
        title: "Cleared",
        description: "Cart cleared successfully",
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to clear cart";
      setError(msg);
      toast({
        title: "Clear failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setClearOpen(false);
    }
  };

  const onDeleteCart = async () => {
    setLoading(true);
    setError("");
    try {
      await adminDeleteCart(id);
      toast({
        title: "Deleted",
        description: "Cart document deleted",
      });
      router.push("/admin/cart");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete cart";
      setError(msg);
      toast({
        title: "Delete failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cart Detail</h1>
        <p className="text-slate-600 mt-1">
          User: <b className="text-slate-900">{userName}</b> ({userEmail})
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          className="border-slate-300"
          onClick={() => router.push("/admin/cart")}
        >
          Back
        </Button>

        <Button
          variant="outline"
          className="border-slate-300"
          onClick={() => setClearOpen(true)}
          disabled={loading}
        >
          Clear Cart
        </Button>

        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => setDeleteOpen(true)}
          disabled={loading}
        >
          Delete Cart
        </Button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <Card className="rounded-2xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900">Items</div>
          <div className="font-semibold text-green-700">
            Subtotal: {money(subtotal)}
          </div>
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

                  const snap = Number(it.priceSnapshot ?? 0);
                  const price =
                    snap > 0
                      ? snap
                      : p.discountPrice !== null && p.discountPrice !== undefined
                      ? Number(p.discountPrice)
                      : Number(p.price || 0);

                  const qty = Number(it.qty || 0);
                  const lineTotal = price * qty;

                  return (
                    <tr key={String(p._id)} className="border-t">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">
                          {p.name || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          SKU: {p.sku || "-"}
                        </div>
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
                                const v = Number(
                                  (e.target as HTMLInputElement).value
                                );
                                onSetQty(String(p._id), v);
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            className="border-slate-300 h-9"
                            onClick={(e) => {
                              const wrap = (e.currentTarget
                                .parentElement as HTMLElement) || null;
                              const input = wrap?.querySelector(
                                "input"
                              ) as HTMLInputElement | null;
                              const v = Number(input?.value ?? qty);
                              onSetQty(String(p._id), v);
                            }}
                          >
                            Save
                          </Button>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Press Enter or Save
                        </div>
                      </td>

                      <td className="p-3 font-semibold text-green-700">
                        {money(lineTotal)}
                      </td>

                      <td className="p-3 text-right">
                        <Button
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            setRemoveId(String(p._id));
                            setRemoveName(String(p.name || ""));
                          }}
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

      {/* ✅ Confirm Remove Item */}
      <ConfirmDialog
        open={!!removeId}
        onOpenChange={(v) => {
          if (!v) {
            setRemoveId(null);
            setRemoveName("");
          }
        }}
        title="Remove item?"
        description={
          removeName
            ? `This will remove “${removeName}” from the cart.`
            : "This will remove the item from the cart."
        }
        confirmText={loading ? "Removing..." : "Remove"}
        cancelText="Cancel"
        destructive
        onConfirm={onRemove}
        loading={loading}
      />

      {/* ✅ Confirm Clear Cart */}
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={(v) => setClearOpen(v)}
        title="Clear this cart?"
        description="This will remove all items from this cart."
        confirmText={loading ? "Clearing..." : "Clear cart"}
        cancelText="Cancel"
        destructive
        onConfirm={onClear}
        loading={loading}
      />

      {/* ✅ Confirm Delete Cart */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(v) => setDeleteOpen(v)}
        title="Delete cart document?"
        description="This will permanently delete the cart document. This action cannot be undone."
        confirmText={loading ? "Deleting..." : "Delete cart"}
        cancelText="Cancel"
        destructive
        onConfirm={onDeleteCart}
        loading={loading}
      />
    </div>
  );
}