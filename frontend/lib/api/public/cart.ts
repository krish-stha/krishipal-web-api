// frontend/lib/api/public/cart.ts
import { api } from "@/lib/api/axios";

export type CartItem = {
  product: any; // populated product object
  qty: number;
};

export type CartResponse = {
  success: boolean;
  data: {
    _id: string;
    user: string;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
  };
};

export async function getMyCartApi() {
  const res = await api.get<CartResponse>("/cart");
  return res.data;
}

export async function addToCartApi(productId: string, qty = 1) {
  const res = await api.post<CartResponse>("/cart/items", { productId, qty });
  return res.data;
}

export async function updateCartQtyApi(productId: string, qty: number) {
  const res = await api.put<CartResponse>(`/cart/items/${productId}`, { qty });
  return res.data;
}

export async function removeCartItemApi(productId: string) {
  const res = await api.delete<CartResponse>(`/cart/items/${productId}`);
  return res.data;
}

export async function clearCartApi() {
  const res = await api.delete<CartResponse>("/cart");
  return res.data;
}
