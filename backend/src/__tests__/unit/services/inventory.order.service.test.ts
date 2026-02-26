// src/__tests__/unit/services/inventory.order.service.test.ts

import { HttpError } from "../../../errors/http-error";

// ---- mongoose mock (IMPORTANT: default export must contain Types) ----
const isValidMock = jest.fn();

jest.mock("mongoose", () => ({
  __esModule: true,
  default: {
    Types: {
      ObjectId: {
        isValid: isValidMock,
      },
    },
  },
  Types: {
    ObjectId: {
      isValid: isValidMock,
    },
  },
}));

// ---- OrderModel mock ----
const findOneMock = jest.fn();
jest.mock("../../../models/order.model", () => ({
  __esModule: true,
  OrderModel: {
    findOne: (...args: any[]) => findOneMock(...args),
  },
}));

// ---- InventoryService mock (service creates `const inv = new InventoryService()`) ----
const stockOutAtomicMock = jest.fn();
jest.mock("../../../services/inventory.service", () => ({
  __esModule: true,
  InventoryService: jest.fn().mockImplementation(() => ({
    stockOutAtomic: (...args: any[]) => stockOutAtomicMock(...args),
  })),
}));

import mongoose from "mongoose";
import { InventoryOrderService } from "../../../services/inventory.order.service";

describe("InventoryOrderService.applyPaidOrderStockOut", () => {
  const svc = new InventoryOrderService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws 400 when orderId is invalid", async () => {
    isValidMock.mockReturnValue(false);

    await expect(svc.applyPaidOrderStockOut("bad-id")).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid orderId",
    });

    expect(findOneMock).not.toHaveBeenCalled();
  });

  it("throws 404 when order not found", async () => {
    isValidMock.mockReturnValue(true);
    findOneMock.mockResolvedValue(null);

    await expect(svc.applyPaidOrderStockOut("507f1f77bcf86cd799439011")).rejects.toMatchObject(
      { statusCode: 404, message: "Order not found" }
    );
  });

  it("throws 400 when order is not paid", async () => {
    isValidMock.mockReturnValue(true);

    findOneMock.mockResolvedValue({
      _id: "o1",
      deleted_at: null,
      paymentStatus: "pending",
      paymentMeta: {},
      items: [],
      save: jest.fn(),
    });

    await expect(svc.applyPaidOrderStockOut("507f1f77bcf86cd799439011")).rejects.toMatchObject(
      { statusCode: 400, message: "Order is not paid" }
    );

    expect(stockOutAtomicMock).not.toHaveBeenCalled();
  });

  it("returns Already deducted when marker is true (idempotent)", async () => {
    isValidMock.mockReturnValue(true);

    const save = jest.fn();
    findOneMock.mockResolvedValue({
      _id: "o2",
      deleted_at: null,
      paymentStatus: "paid",
      paymentMeta: { inventoryDeducted: true },
      items: [{ product: "p1", qty: 2, sku: "S1", name: "N1" }],
      save,
    });

    const res = await svc.applyPaidOrderStockOut("507f1f77bcf86cd799439011");

    expect(res).toEqual({ ok: true, message: "Already deducted" });
    expect(stockOutAtomicMock).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("deducts stock for each item, sets marker, saves, and returns success", async () => {
    isValidMock.mockReturnValue(true);

    const save = jest.fn().mockResolvedValue(true);

    const order: any = {
      _id: "o3",
      deleted_at: null,
      paymentStatus: "PAID", // lowercased in service
      paymentMeta: {},
      items: [
        { product: "p1", qty: 2, sku: "S1", name: "N1" },
        { product: "p2", qty: 1, sku: "S2", name: "N2" },
      ],
      save,
    };

    findOneMock.mockResolvedValue(order);

    const res = await svc.applyPaidOrderStockOut("507f1f77bcf86cd799439011", "actor-1");

    expect(stockOutAtomicMock).toHaveBeenCalledTimes(2);

    expect(stockOutAtomicMock).toHaveBeenNthCalledWith(1, {
      productId: "p1",
      qty: 2,
      type: "ORDER_PAID",
      orderId: "o3",
      actorId: "actor-1",
      reason: "Order paid: o3",
      meta: { sku: "S1", name: "N1" },
    });

    expect(stockOutAtomicMock).toHaveBeenNthCalledWith(2, {
      productId: "p2",
      qty: 1,
      type: "ORDER_PAID",
      orderId: "o3",
      actorId: "actor-1",
      reason: "Order paid: o3",
      meta: { sku: "S2", name: "N2" },
    });

    expect(order.paymentMeta.inventoryDeducted).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);

    expect(res).toEqual({ ok: true, message: "Stock deducted" });
  });
});