import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

export async function adminListOrders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}) {
  const res = await api.get(endpoints.admin.orders, {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.from ? { from: params.from } : {}),
      ...(params?.to ? { to: params.to } : {}),
    },
  });
  return res.data;
}

export async function adminGetOrderById(id: string) {
  const res = await api.get(endpoints.admin.orderById(id));
  return res; // { success, data: order }
}

export async function adminUpdateOrderStatus(id: string, status: string) {
  const res = await api.put(endpoints.admin.orderUpdateStatus(id), { status });
  return res;
}
