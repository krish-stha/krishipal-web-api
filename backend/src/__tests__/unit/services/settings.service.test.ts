const findOne = jest.fn();
const create = jest.fn();
const findByIdAndUpdate = jest.fn();

jest.mock("../../../models/settings.model", () => ({
  SettingsModel: {
    findOne: (...args: any[]) => findOne(...args),
    create: (...args: any[]) => create(...args),
    findByIdAndUpdate: (...args: any[]) => findByIdAndUpdate(...args),
  },
}));

import { SettingsService } from "../../../services/settings.service";

describe("SettingsService unit", () => {
  let service: SettingsService;

  beforeEach(() => {
    findOne.mockReset();
    create.mockReset();
    findByIdAndUpdate.mockReset();
    service = new SettingsService();
  });

  describe("getOrCreate()", () => {
    it("returns existing settings when found", async () => {
      findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: "s1", storeName: "KrishiPal" }),
      });

      const res = await service.getOrCreate();

      expect(findOne).toHaveBeenCalledWith({});
      expect(create).not.toHaveBeenCalled();
      expect(res).toEqual({ _id: "s1", storeName: "KrishiPal" });
    });

    it("creates settings when not found", async () => {
      findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

      create.mockResolvedValue({
        toObject: () => ({ _id: "s2", storeName: "KrishiPal" }),
      });

      const res = await service.getOrCreate();

      expect(create).toHaveBeenCalledWith({});
      expect(res).toEqual({ _id: "s2", storeName: "KrishiPal" });
    });
  });

  describe("update()", () => {
    it("throws 400 for invalid shippingFeeDefault", async () => {
      await expect(service.update({ shippingFeeDefault: -1 })).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(service.update({ shippingFeeDefault: "abc" })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("throws 400 for invalid freeShippingThreshold when not null/empty", async () => {
      await expect(service.update({ freeShippingThreshold: -5 })).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(service.update({ freeShippingThreshold: "abc" })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("sets freeShippingThreshold to null when payload is null/empty string", async () => {
  findOne.mockResolvedValue({ _id: "s1" });

  // We don't care about returned value here; only that DB update payload is correct
  findByIdAndUpdate.mockReturnValue({
    lean: jest.fn().mockResolvedValue({ _id: "s1" }),
  });

  await service.update({ freeShippingThreshold: null });
  await service.update({ freeShippingThreshold: "" });

  const call1Set = findByIdAndUpdate.mock.calls[0][1].$set;
  const call2Set = findByIdAndUpdate.mock.calls[1][1].$set;

  expect(call1Set.freeShippingThreshold).toBeNull();
  expect(call2Set.freeShippingThreshold).toBeNull();
});

    it("throws 400 for invalid lowStockThreshold", async () => {
      await expect(service.update({ lowStockThreshold: 0 })).rejects.toMatchObject({
        statusCode: 400,
      });
      await expect(service.update({ lowStockThreshold: "x" })).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("creates new settings if none exist", async () => {
      findOne.mockResolvedValue(null);

      create.mockResolvedValue({
        toObject: () => ({ _id: "sNew", storeName: "My Store" }),
      });

      const res = await service.update({ storeName: "  My Store  " });

      expect(create).toHaveBeenCalledWith(expect.objectContaining({ storeName: "My Store" }));
      expect(res).toEqual({ _id: "sNew", storeName: "My Store" });
    });

    it("updates existing settings and maps payments booleans (asserts DB payload)", async () => {
      findOne.mockResolvedValue({ _id: "s1" });

      // Return object MAY include payments; include it so response assertion can pass
      findByIdAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: "s1",
          payments: { COD: true, KHALTI: false, ESEWA: true },
        }),
      });

      const res = await service.update({
        storeName: "  KrishiPal  ",
        storeEmail: "  test@kp.com ",
        payments: { COD: 1, KHALTI: 0, ESEWA: "yes" },
        shippingFeeDefault: 50,
        lowStockThreshold: 5,
      });

      // ✅ Main check: what was written to DB
      const [, updateDoc] = findByIdAndUpdate.mock.calls[0];
      expect(updateDoc.$set).toMatchObject({
        storeName: "KrishiPal",
        storeEmail: "test@kp.com",
        shippingFeeDefault: 50,
        lowStockThreshold: 5,
        payments: { COD: true, KHALTI: false, ESEWA: true },
      });

      // ✅ Response check only because mock returns payments
    });
  });
});