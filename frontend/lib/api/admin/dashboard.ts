import { api } from "@/lib/api/axios";

export async function adminDashboardSummary(params?: { months?: number }) {
  const res = await api.get("/admin/dashboard/summary", { params });
  return res.data; // { success, data }
}