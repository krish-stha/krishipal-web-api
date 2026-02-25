import { api } from "../axios";
import { endpoints } from "../endpoints";

export async function adminDashboardSummary(params?: {
  months?: number;
  from?: string;
  to?: string;
  groupBy?: "day" | "month";
}) {
  const res = await api.get(endpoints.admin.dashboardSummary, {
    params: {
      months: params?.months ?? 6,
      ...(params?.from ? { from: params.from } : {}),
      ...(params?.to ? { to: params.to } : {}),
      ...(params?.groupBy ? { groupBy: params.groupBy } : {}),
    },
  });
  return res.data;
}