import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

export function adminStockIn(payload: { productId: string; qty: number; reason?: string }) {
  return api.post(endpoints.admin.inventoryStockIn, payload);
}
export function adminStockOut(payload: { productId: string; qty: number; reason?: string }) {
  return api.post(endpoints.admin.inventoryStockOut, payload);
}
export function adminInventoryLogs(params?: { page?: number; limit?: number; productId?: string; type?: string }) {
  return api.get(endpoints.admin.inventoryLogs, { params });
}
export function adminLowStock(threshold = 5) {
  return api.get(endpoints.admin.inventoryLowStock, { params: { threshold } });
}