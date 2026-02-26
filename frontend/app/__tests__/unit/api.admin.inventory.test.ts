import {
  adminStockIn,
  adminStockOut,
  adminInventoryLogs,
  adminLowStock,
} from "@/lib/api/admin/inventory";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

jest.mock("@/lib/api/axios", () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock("@/lib/api/endpoints", () => ({
  endpoints: {
    admin: {
      inventoryStockIn: "/admin/inventory/stock-in",
      inventoryStockOut: "/admin/inventory/stock-out",
      inventoryLogs: "/admin/inventory/logs",
      inventoryLowStock: "/admin/inventory/low-stock",
    },
  },
}));

const apiMock = api as unknown as { post: jest.Mock; get: jest.Mock };

describe("admin inventory api", () => {
  beforeEach(() => jest.clearAllMocks());

  test("adminStockIn POST", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { ok: true } });

    const payload = { productId: "p1", qty: 5, reason: "restock" };
    const out = await adminStockIn(payload);

    expect(apiMock.post).toHaveBeenCalledWith(endpoints.admin.inventoryStockIn, payload);
    expect(out).toEqual({ data: { ok: true } }); // note: your function returns api.post(...) not res.data
  });

  test("adminLowStock GET with threshold", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true } });

    await adminLowStock(7);

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.inventoryLowStock, {
      params: { threshold: 7 },
    });
  });

  test("adminLowStock GET without threshold", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true } });

    await adminLowStock();

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.inventoryLowStock, { params: {} });
  });

  test("adminInventoryLogs GET with params", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true } });

    const params = { page: 2, limit: 10, productId: "p1", type: "IN" };
    await adminInventoryLogs(params);

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.inventoryLogs, { params });
  });
});