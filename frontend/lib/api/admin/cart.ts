import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

export function adminListCarts(params?: { page?: number; limit?: number; search?: string }) {
  return api.get(endpoints.admin.carts, { params });
}

export function adminGetCartById(id: string) {
  return api.get(endpoints.admin.cartById(id));
}

export function adminSetCartItemQty(id: string, productId: string, qty: number) {
  return api.put(endpoints.admin.cartSetItemQty(id, productId), { qty });
}

export function adminRemoveCartItem(id: string, productId: string) {
  return api.delete(endpoints.admin.cartRemoveItem(id, productId));
}

export function adminClearCart(id: string) {
  return api.delete(endpoints.admin.cartClear(id));
}

export function adminDeleteCart(id: string) {
  return api.delete(endpoints.admin.cartDelete(id));
}
