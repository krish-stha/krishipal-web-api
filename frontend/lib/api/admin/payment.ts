import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

export async function adminListPaymentLogs(params?: { page?: number; limit?: number; search?: string }) {
  return api.get(endpoints.admin.paymentLogs, { params });
}

export async function adminListRefunds(params?: { page?: number; limit?: number; status?: string }) {
  return api.get(endpoints.admin.refunds, { params });
}

export async function adminApproveRefund(id: string, adminNote?: string) {
  return api.put(endpoints.admin.refundApprove(id), { adminNote: adminNote ?? "" });
}

export async function adminRejectRefund(id: string, adminNote?: string) {
  return api.put(endpoints.admin.refundReject(id), { adminNote: adminNote ?? "" });
}

export async function adminMarkRefundProcessed(id: string) {
  return api.put(endpoints.admin.refundProcessed(id), {});
}
