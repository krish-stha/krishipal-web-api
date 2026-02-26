
import { adminApproveRefund, adminListPaymentLogs, adminMarkRefundProcessed, adminRejectRefund } from "@/lib/api/admin/payment";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

jest.mock("@/lib/api/axios", () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock("@/lib/api/endpoints", () => ({
  endpoints: {
    admin: {
      paymentLogs: "/admin/payment/logs",
      refunds: "/admin/refunds",
      refundApprove: (id: string) => `/admin/refunds/${id}/approve`,
      refundReject: (id: string) => `/admin/refunds/${id}/reject`,
      refundProcessed: (id: string) => `/admin/refunds/${id}/processed`,
    },
  },
}));

const apiMock = api as unknown as { get: jest.Mock; put: jest.Mock };

describe("admin order/refund api", () => {
  beforeEach(() => jest.clearAllMocks());

  test("adminListPaymentLogs", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true } });

    const params = { page: 1, limit: 20, search: "abc" };
    const out = await adminListPaymentLogs(params);

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.paymentLogs, { params });
    expect(out).toEqual({ data: { ok: true } }); // returns api.get(...) promise
  });

  test("adminApproveRefund sends adminNote", async () => {
    apiMock.put.mockResolvedValueOnce({ data: { ok: true } });

    await adminApproveRefund("r1", "ok");

    expect(apiMock.put).toHaveBeenCalledWith(endpoints.admin.refundApprove("r1"), { adminNote: "ok" });
  });

  test("adminApproveRefund defaults adminNote to empty string", async () => {
    apiMock.put.mockResolvedValueOnce({ data: { ok: true } });

    await adminApproveRefund("r1");

    expect(apiMock.put).toHaveBeenCalledWith(endpoints.admin.refundApprove("r1"), { adminNote: "" });
  });

  test("adminRejectRefund defaults adminNote to empty string", async () => {
    apiMock.put.mockResolvedValueOnce({ data: { ok: true } });

    await adminRejectRefund("r2");

    expect(apiMock.put).toHaveBeenCalledWith(endpoints.admin.refundReject("r2"), { adminNote: "" });
  });

  test("adminMarkRefundProcessed", async () => {
    apiMock.put.mockResolvedValueOnce({ data: { ok: true } });

    await adminMarkRefundProcessed("r3");

    expect(apiMock.put).toHaveBeenCalledWith(endpoints.admin.refundProcessed("r3"), {});
  });
});