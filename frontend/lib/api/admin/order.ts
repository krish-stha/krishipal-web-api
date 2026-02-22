import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

export async function adminListOrders(params?: { page?: number; limit?: number; search?: string }) {
  const res = await api.get(endpoints.admin.orders, { params });
  return res; // { success, data: rows, meta }
}

export async function adminGetOrderById(id: string) {
  const res = await api.get(endpoints.admin.orderById(id));
  return res; // { success, data: order }
}

export async function adminUpdateOrderStatus(id: string, status: string) {
  const res = await api.put(endpoints.admin.orderUpdateStatus(id), { status });
  return res;
}
