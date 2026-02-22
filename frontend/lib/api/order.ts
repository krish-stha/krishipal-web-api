import { api } from "./axios";
import { endpoints } from "./endpoints";

export async function createOrder(payload: { address: string; paymentMethod?: "COD" }) {
  const res = await api.post(endpoints.orders.create, {
    address: payload.address,
    paymentMethod: payload.paymentMethod ?? "COD",
  });
  return res.data;
}

export async function getMyOrders(page: number = 1, limit: number = 10) {
  const res = await api.get(endpoints.orders.myOrders, { params: { page, limit } });
  return res.data;
}

export async function getMyOrderById(id: string) {
  const res = await api.get(endpoints.orders.byId(id));
  return res.data;
}

// ✅ NEW: cancel my order (only works if backend allows pending only)
export async function cancelMyOrder(id: string, reason?: string) {
  const res = await api.put(`/orders/${id}/cancel`, { reason: reason ?? "" });
  return res.data;
}

