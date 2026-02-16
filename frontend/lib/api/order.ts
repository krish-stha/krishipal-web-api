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

// ✅ NEW: get single order for tracking page
export async function getMyOrderById(id: string) {
  const res = await api.get(endpoints.orders.byId(id));
  return res.data;
}
