"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addToCart, clearCart, getMyCart, removeFromCart, updateCartQty } from "@/lib/api/cart";
import { useAuth } from "@/lib/contexts/auth-contexts";

type CartItem = {
  product: any;
  qty: number;
  priceSnapshot: number;
};

type CartData = {
  _id?: string;
  user?: string;
  items: CartItem[];
};

type CartContextType = {
  cart: CartData | null;
  count: number;
  loading: boolean;

  // ✅ Selection for partial checkout
  selectedIds: string[];
  isSelected: (productId: string) => boolean;
  toggleSelected: (productId: string) => void;
  selectOnly: (productId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  refresh: () => Promise<void>;
  add: (productId: string, qty?: number) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

function safeParse(json: string | null) {
  try {
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ selection state (productIds)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const storageKey = useMemo(() => {
  const uid = user?.id || "";
  return uid ? `krishipal_cart_selected_${uid}` : "krishipal_cart_selected_guest";
}, [user?.id]);

  // load selection from localStorage on login
  useEffect(() => {
    if (!user) {
      setSelectedIds([]);
      return;
    }
    const raw = localStorage.getItem(storageKey);
    const parsed = safeParse(raw);
    if (Array.isArray(parsed)) setSelectedIds(parsed.map(String));
  }, [user, storageKey]);

  // persist selection
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey, JSON.stringify(selectedIds));
  }, [selectedIds, storageKey, user]);

  const refresh = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getMyCart();
      const next = res.data || null;
      setCart(next);

      // ✅ keep selection valid: remove ids not in cart; if empty -> select all
      const idsInCart = (next?.items || [])
  .map((it: any) => String(it?.product || ""))
  .filter(Boolean);

      setSelectedIds((prev) => {
        const filtered = prev.filter((id) => idsInCart.includes(id));
        return filtered.length > 0 ? filtered : idsInCart; // default select all
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  const count = useMemo(() => {
    const items = cart?.items || [];
    return items.reduce((sum, it) => sum + Number(it.qty || 0), 0);
  }, [cart]);

  const isSelected = (productId: string) => selectedIds.includes(String(productId));

  const toggleSelected = (productId: string) => {
    const id = String(productId);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectOnly = (productId: string) => {
    const id = String(productId);
    setSelectedIds([id]);
  };

  const selectAll = () => {
    const ids = (cart?.items || [])
  .map((it: any) => String(it?.product || ""))
  .filter(Boolean);
setSelectedIds(ids);
  };

  const clearSelection = () => setSelectedIds([]);

  const add = async (productId: string, qty: number = 1) => {
    if (!user) return;
    const res = await addToCart(productId, qty);
    const next = res.data || null;
    setCart(next);

    // ✅ if no selection -> auto select added item
    setSelectedIds((prev) => {
      const id = String(productId);
      if (prev.length === 0) return [id];
      return prev.includes(id) ? prev : [...prev, id];
    });
  };

  const setQty = async (productId: string, qty: number) => {
    if (!user) return;
    const res = await updateCartQty(productId, qty);
    setCart(res.data || null);
  };

  const remove = async (productId: string) => {
    if (!user) return;
    const res = await removeFromCart(productId);
    const next = res.data || null;
    setCart(next);

    const id = String(productId);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const clear = async () => {
    if (!user) return;
    const res = await clearCart();
    setCart(res.data || null);
    setSelectedIds([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        count,
        loading,

        selectedIds,
        isSelected,
        toggleSelected,
        selectOnly,
        selectAll,
        clearSelection,

        refresh,
        add,
        setQty,
        remove,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}