import { api } from "./axios";

export async function initiateKhaltiPayment(orderId: string) {
  // ✅ uses interceptor, sends Authorization automatically
  const res = await api.post(`/payments/khalti/initiate`, { orderId });
  return res.data;
}

export async function verifyKhaltiPayment(payload: { orderId: string; pidx: string }) {
  const res = await api.post(`/payments/khalti/verify`, payload);
  return res.data;
}
