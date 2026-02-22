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
  refresh: () => Promise<void>;
  add: (productId: string, qty?: number) => Promise<void>;
  setQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const res = await getMyCart();
      setCart(res.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // refresh when user changes (login/logout)
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  const count = useMemo(() => {
    const items = cart?.items || [];
    return items.reduce((sum, it) => sum + Number(it.qty || 0), 0);
  }, [cart]);

  const add = async (productId: string, qty: number = 1) => {
    if (!user) return;
    const res = await addToCart(productId, qty);
    setCart(res.data || null);
  };

  const setQty = async (productId: string, qty: number) => {
    if (!user) return;
    const res = await updateCartQty(productId, qty);
    setCart(res.data || null);
  };

  const remove = async (productId: string) => {
    if (!user) return;
    const res = await removeFromCart(productId);
    setCart(res.data || null);
  };

  const clear = async () => {
    if (!user) return;
    const res = await clearCart();
    setCart(res.data || null);
  };

  return (
    <CartContext.Provider value={{ cart, count, loading, refresh, add, setQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
