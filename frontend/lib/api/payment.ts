import { api } from "./axios";
import { endpoints } from "./endpoints";


export async function initiateKhaltiPayment(orderId: string) {
  // ✅ uses interceptor, sends Authorization automatically
  const res = await api.post(`/payments/khalti/initiate`, { orderId });
  return res.data;
}

export async function verifyKhaltiPayment(payload: { orderId: string; pidx: string }) {
  const res = await api.post(`/payments/khalti/verify`, payload);
  return res.data;
}

export async function requestRefund(payload: { orderId: string; amount: number; reason?: string }) {
  const res = await api.post(endpoints.payments.refundRequest, payload);
  return res.data;
}

export async function getMyRefunds() {
  const res = await api.get(endpoints.payments.myRefunds);
  return res.data;
}
