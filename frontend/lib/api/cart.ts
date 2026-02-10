import { api } from "./axios";
import { endpoints } from "./endpoints";

export async function getMyCart() {
  const res = await api.get(endpoints.cart.base);
  return res.data; // { success, data }
}

export async function addToCart(productId: string, qty: number = 1) {
  const res = await api.post(endpoints.cart.addItem, { productId, qty });
  return res.data;
}

export async function updateCartQty(productId: string, qty: number) {
  const res = await api.put(endpoints.cart.updateItem(productId), { qty });
  return res.data;
}

export async function removeFromCart(productId: string) {
  const res = await api.delete(endpoints.cart.removeItem(productId));
  return res.data;
}

export async function clearCart() {
  const res = await api.delete(endpoints.cart.clear);
  return res.data;
}
