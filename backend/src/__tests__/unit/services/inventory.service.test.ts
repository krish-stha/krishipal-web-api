import mongoose from "mongoose";
import { InventoryService } from "../../../services/inventory.service";

const mockFindById = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFind = jest.fn();

jest.mock("../../../models/product.model", () => ({
  ProductModel: {
    findById: (...args: any[]) => mockFindById(...args),
    findOneAndUpdate: (...args: any[]) => mockFindOneAndUpdate(...args),
    find: (...args: any[]) => mockFind(...args),
  },
}));

const mockTxnCreate = jest.fn();
const mockTxnCount = jest.fn();
const mockTxnFind = jest.fn();

jest.mock("../../../models/inventory_transaction.model", () => ({
  InventoryTransactionModel: {
    create: (...args: any[]) => mockTxnCreate(...args),
    countDocuments: (...args: any[]) => mockTxnCount(...args),
    find: (...args: any[]) => mockTxnFind(...args),
  },
}));

// helper: mimic mongoose chain .select().lean()
function chainSelectLean(resolvedValue: any) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolvedValue),
  };
}

// helper: mimic find chain .select().sort().populate().lean()
function chainFind(resolvedValue: any) {
  return {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolvedValue),
  };
}

// helper: mimic txn find chain .sort().skip().limit().populate().lean()
function chainTxnFind(resolvedValue: any) {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(resolvedValue),
  };
}

describe("InventoryService (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("stockOutAtomic", () => {
    it("throws 400 for invalid qty", async () => {
      const svc = new InventoryService();

      await expect(
        svc.stockOutAtomic({ productId: "507f1f77bcf86cd799439011", qty: 0 })
      ).rejects.toMatchObject({ statusCode: 400 });

      await expect(
        svc.stockOutAtomic({ productId: "507f1f77bcf86cd799439011", qty: -2 })
      ).rejects.toMatchObject({ statusCode: 400 });

      await expect(
        svc.stockOutAtomic({ productId: "507f1f77bcf86cd799439011", qty: 1.5 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("throws 404 if product not found", async () => {
      mockFindById.mockReturnValue(chainSelectLean(null)); // before = null

      const svc = new InventoryService();
      await expect(
        svc.stockOutAtomic({ productId: "507f1f77bcf86cd799439011", qty: 1 })
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
      expect(mockTxnCreate).not.toHaveBeenCalled();
    });

    it("throws 400 if before stock is insufficient", async () => {
      mockFindById.mockReturnValue(chainSelectLean({ stock: 2 })); // beforeStock 2

      const svc = new InventoryService();
      await expect(
        svc.stockOutAtomic({ productId: "507f1f77bcf86cd799439011", qty: 3 })
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
      expect(mockTxnCreate).not.toHaveBeenCalled();
    });

    it("throws 400 if atomic update fails (race condition)", async () => {
      mockFindById.mockReturnValue(chainSelectLean({ stock: 5 })); // enough in read
      mockFindOneAndUpdate.mockReturnValue(chainSelectLean(null)); // update failed

      const svc = new InventoryService();
      await expect(
        svc.stockOutAtomic({ productId: "507f1f77bcf86cd799439011", qty: 5 })
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(mockTxnCreate).not.toHaveBeenCalled();
    });

    it("decrements stock and writes ledger (default type=STOCK_OUT)", async () => {
      const pid = "507f1f77bcf86cd799439011";
      mockFindById.mockReturnValue(chainSelectLean({ stock: 10 }));
      mockFindOneAndUpdate.mockReturnValue(chainSelectLean({ stock: 7 }));
      mockTxnCreate.mockResolvedValue({ _id: "txn1" });

      const svc = new InventoryService();
      const res = await svc.stockOutAtomic({
        productId: pid,
        qty: 3,
        reason: "Sold",
        meta: { a: 1 },
      });

      expect(res).toEqual({ beforeStock: 10, afterStock: 7 });

      // ensure atomic query uses ObjectId and $gte qty
      const updateCall = mockFindOneAndUpdate.mock.calls[0];
      expect(updateCall[0]).toEqual(
        expect.objectContaining({
          _id: expect.any(mongoose.Types.ObjectId),
          deleted_at: null,
          stock: { $gte: 3 },
        })
      );
      expect(updateCall[1]).toEqual({ $inc: { stock: -3 } });

      // ledger
      expect(mockTxnCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          product: expect.any(mongoose.Types.ObjectId),
          type: "STOCK_OUT",
          qty: 3,
          beforeStock: 10,
          afterStock: 7,
          reason: "Sold",
          order: null,
          actor: null,
          meta: { a: 1 },
        })
      );
    });

    it("writes ledger with ORDER_PAID + orderId/actorId", async () => {
      mockFindById.mockReturnValue(chainSelectLean({ stock: 6 }));
      mockFindOneAndUpdate.mockReturnValue(chainSelectLean({ stock: 4 }));
      mockTxnCreate.mockResolvedValue({ _id: "txn2" });

      const svc = new InventoryService();
      await svc.stockOutAtomic({
        productId: "507f1f77bcf86cd799439011",
        qty: 2,
        type: "ORDER_PAID",
        orderId: "507f1f77bcf86cd799439012",
        actorId: "507f1f77bcf86cd799439013",
      });

      expect(mockTxnCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "ORDER_PAID",
          order: expect.any(mongoose.Types.ObjectId),
          actor: expect.any(mongoose.Types.ObjectId),
        })
      );
    });
  });

  describe("stockIn", () => {
    it("throws 400 for invalid qty", async () => {
      const svc = new InventoryService();

      await expect(
        svc.stockIn({ productId: "507f1f77bcf86cd799439011", qty: 0 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("throws 404 if product not found in before read", async () => {
      mockFindById.mockReturnValue(chainSelectLean(null));

      const svc = new InventoryService();
      await expect(
        svc.stockIn({ productId: "507f1f77bcf86cd799439011", qty: 5 })
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
      expect(mockTxnCreate).not.toHaveBeenCalled();
    });

    it("throws 404 if update fails", async () => {
      mockFindById.mockReturnValue(chainSelectLean({ stock: 1 }));
      mockFindOneAndUpdate.mockReturnValue(chainSelectLean(null));

      const svc = new InventoryService();
      await expect(
        svc.stockIn({ productId: "507f1f77bcf86cd799439011", qty: 5 })
      ).rejects.toMatchObject({ statusCode: 404 });

      expect(mockTxnCreate).not.toHaveBeenCalled();
    });

    it("increments stock and writes STOCK_IN ledger", async () => {
      mockFindById.mockReturnValue(chainSelectLean({ stock: 2 }));
      mockFindOneAndUpdate.mockReturnValue(chainSelectLean({ stock: 7 }));
      mockTxnCreate.mockResolvedValue({ _id: "txn3" });

      const svc = new InventoryService();
      const res = await svc.stockIn({
        productId: "507f1f77bcf86cd799439011",
        qty: 5,
        actorId: "507f1f77bcf86cd799439013",
        reason: "Restock",
      });

      expect(res).toEqual({ beforeStock: 2, afterStock: 7 });

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(mongoose.Types.ObjectId),
          deleted_at: null,
        }),
        { $inc: { stock: 5 } },
        { new: true }
      );

      expect(mockTxnCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "STOCK_IN",
          qty: 5,
          beforeStock: 2,
          afterStock: 7,
          reason: "Restock",
          actor: expect.any(mongoose.Types.ObjectId),
        })
      );
    });
  });

  describe("lowStock", () => {
    it("returns products with stock <= threshold", async () => {
      const rows = [{ _id: "p1" }, { _id: "p2" }];
      mockFind.mockReturnValue(chainFind(rows));

      const svc = new InventoryService();
      const res = await svc.lowStock(3);

      expect(mockFind).toHaveBeenCalledWith({ deleted_at: null, stock: { $lte: 3 } });
      expect(res).toEqual(rows);
    });

    it("coerces negative threshold to 0", async () => {
      mockFind.mockReturnValue(chainFind([]));

      const svc = new InventoryService();
      await svc.lowStock(-10);

      expect(mockFind).toHaveBeenCalledWith({ deleted_at: null, stock: { $lte: 0 } });
    });
  });

  describe("listLogs", () => {
    it("returns logs + meta with pagination and filters", async () => {
      mockTxnCount.mockResolvedValue(25);
      mockTxnFind.mockReturnValue(chainTxnFind([{ _id: "t1" }]));

      const svc = new InventoryService();
      const res = await svc.listLogs({
        page: 2,
        limit: 10,
        productId: "507f1f77bcf86cd799439011",
        type: "stock_in",
      });

      // filter: product must be ObjectId, type uppercased
      expect(mockTxnCount).toHaveBeenCalledWith(
        expect.objectContaining({
          product: expect.any(mongoose.Types.ObjectId),
          type: "STOCK_IN",
        })
      );

      expect(res).toEqual({
        data: [{ _id: "t1" }],
        meta: { total: 25, page: 2, limit: 10 },
      });
    });

    it("ignores invalid productId filter (does not add product)", async () => {
      mockTxnCount.mockResolvedValue(0);
      mockTxnFind.mockReturnValue(chainTxnFind([]));

      const svc = new InventoryService();
      await svc.listLogs({ productId: "invalid", type: "STOCK_OUT" });

      expect(mockTxnCount).toHaveBeenCalledWith({ type: "STOCK_OUT" });
    });

    it("caps limit to 100 and min 1", async () => {
      mockTxnCount.mockResolvedValue(0);
      mockTxnFind.mockReturnValue(chainTxnFind([]));

      const svc = new InventoryService();
      const res = await svc.listLogs({ page: 0, limit: 999 });

      expect(res.meta.page).toBe(1);
      expect(res.meta.limit).toBe(100);
    });
  });
});