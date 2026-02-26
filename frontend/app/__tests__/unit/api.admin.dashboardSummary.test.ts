import { adminDashboardSummary } from "@/lib/api/admin/dashboard";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

jest.mock("@/lib/api/axios", () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock("@/lib/api/endpoints", () => ({
  endpoints: {
    admin: {
      dashboardSummary: "/admin/dashboard/summary",
    },
  },
}));

const apiMock = api as unknown as { get: jest.Mock };

describe("admin dashboard summary api", () => {
  beforeEach(() => jest.clearAllMocks());

  test("defaults months=6 when no params", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true } });

    const out = await adminDashboardSummary();

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.dashboardSummary, {
      params: { months: 6 },
    });
    expect(out).toEqual({ ok: true });
  });

  test("passes from/to/groupBy", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true } });

    await adminDashboardSummary({ months: 3, from: "2026-01-01", to: "2026-02-01", groupBy: "day" });

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.dashboardSummary, {
      params: { months: 3, from: "2026-01-01", to: "2026-02-01", groupBy: "day" },
    });
  });
});