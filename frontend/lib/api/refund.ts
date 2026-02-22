import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

export async function requestRefund(payload: { orderId: string; amount: number; reason?: string }) {
  const res = await api.post(endpoints.payments.refundRequest, payload);
  return res.data;
}

// ✅ optional: if endpoint exists in backend
export async function getMyRefunds() {
  const res = await api.get(endpoints.payments.myRefunds);
  return res.data;
}
