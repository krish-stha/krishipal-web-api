/**
 * Unit tests for CartService (no DB)
 * Mocks:
 * - CartRepository methods
 * - ProductModel.findOne().lean()
 * - CartModel.updateOne (dynamic import used in updateQty)
 */

const getByUserId = jest.fn();
const createForUser = jest.fn();
const upsert = jest.fn();
const clear = jest.fn();

jest.mock("../../../repositories/cart.repository", () => {
  return {
    CartRepository: jest.fn().mockImplementation(() => ({
      getByUserId,
      createForUser,
      upsert,
      clear,
    })),
  };
});

// ProductModel.findOne().lean() chain
const productFindOne = jest.fn();

jest.mock("../../../models/product.model", () => ({
  ProductModel: {
    findOne: (...args: any[]) => productFindOne(...args),
  },
}));

// Dynamic import target used inside updateQty()
const cartUpdateOne = jest.fn();

jest.mock("../../../models/cart.model", () => ({
  CartModel: {
    updateOne: (...args: any[]) => cartUpdateOne(...args),
  },
}));

import { CartService } from "../../../services/cart.service";

describe("CartService unit", () => {
  let service: CartService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CartService();
  });

  function mockProductLean(product: any) {
    productFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(product),
    });
  }

  describe("getCart()", () => {
    it("returns existing cart if found", async () => {
      getByUserId.mockResolvedValue({ user: "u1", items: [] });

      const cart = await service.getCart("u1");

      expect(getByUserId).toHaveBeenCalledWith("u1");
      expect(createForUser).not.toHaveBeenCalled();
      expect(cart).toEqual({ user: "u1", items: [] });
    });

    it("creates cart if missing then returns it", async () => {
      // first call: null, second call: created cart
      getByUserId.mockResolvedValueOnce(null).mockResolvedValueOnce({
        user: "u1",
        items: [],
      });

      const cart = await service.getCart("u1");

      expect(createForUser).toHaveBeenCalledWith("u1");
      expect(getByUserId).toHaveBeenCalledTimes(2);
      expect(cart).toEqual({ user: "u1", items: [] });
    });
  });

  describe("addItem()", () => {
    it("throws 404 if product not found", async () => {
      mockProductLean(null);

      await expect(service.addItem("u1", "p1", 1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("throws 400 if product status not active", async () => {
      mockProductLean({ _id: "p1", status: "draft", stock: 10, price: 100 });

      await expect(service.addItem("u1", "p1", 1)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("throws 400 if out of stock", async () => {
      mockProductLean({ _id: "p1", status: "active", stock: 0, price: 100 });

      await expect(service.addItem("u1", "p1", 1)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("throws 400 if qty exceeds stock", async () => {
      mockProductLean({ _id: "p1", status: "active", stock: 2, price: 100 });

      await expect(service.addItem("u1", "p1", 5)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("pushes new item with priceSnapshot (discountPrice preferred)", async () => {
      mockProductLean({
        _id: "p1",
        status: "active",
        stock: 10,
        price: 100,
        discountPrice: 80,
      });

      // no existing cart item
      getByUserId.mockResolvedValue({ user: "u1", items: [] });

      upsert.mockResolvedValue({ user: "u1", items: [{ product: "p1", qty: 2 }] });

      const result = await service.addItem("u1", "p1", 2);

      expect(upsert).toHaveBeenCalledTimes(1);

      // Verify push payload includes priceSnapshot = discountPrice
      const payload = upsert.mock.calls[0][1];
      expect(payload.$push.items).toMatchObject({
        product: "p1",
        qty: 2,
        priceSnapshot: 80,
      });

      expect(result).toEqual({ user: "u1", items: [{ product: "p1", qty: 2 }] });
    });

    it("increments qty if item exists, capped by stock", async () => {
      mockProductLean({
        _id: "p1",
        status: "active",
        stock: 5,
        price: 100,
        discountPrice: null,
      });

      // existing cart has item qty=4
      getByUserId.mockResolvedValue({
        user: "u1",
        items: [{ product: "p1", qty: 4 }],
      });

      // service calls repo.upsert twice in that branch
      upsert.mockResolvedValue({ user: "u1", items: [{ product: "p1", qty: 5 }] });

      const result = await service.addItem("u1", "p1", 3); // 4+3 => 7 but cap to 5

      expect(upsert).toHaveBeenCalledTimes(2);

      // Both updates should set qty to 5 and priceSnapshot to product.price (100)
      const firstPayload = upsert.mock.calls[0][1];
      const secondPayload = upsert.mock.calls[1][1];

      expect(firstPayload.$set["items.$[i].qty"]).toBe(5);
      expect(firstPayload.$set["items.$[i].priceSnapshot"]).toBe(100);

      expect(secondPayload.$set["items.$[i].qty"]).toBe(5);
      expect(secondPayload.$set["items.$[i].priceSnapshot"]).toBe(100);

      expect(result).toEqual({ user: "u1", items: [{ product: "p1", qty: 5 }] });
    });
  });

  describe("updateQty()", () => {
    it("throws 404 if product not found", async () => {
      mockProductLean(null);

      await expect(service.updateQty("u1", "p1", 1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("throws 400 if out of stock", async () => {
      mockProductLean({ _id: "p1", status: "active", stock: 0, price: 100 });

      await expect(service.updateQty("u1", "p1", 1)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("throws 400 if qty exceeds stock", async () => {
      mockProductLean({ _id: "p1", status: "active", stock: 2, price: 100 });

      await expect(service.updateQty("u1", "p1", 3)).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("updates qty using CartModel.updateOne arrayFilters and returns updated cart", async () => {
      mockProductLean({ _id: "p1", status: "active", stock: 10, price: 100 });

      upsert.mockResolvedValue({ ok: true }); // first upsert call
      cartUpdateOne.mockResolvedValue({ acknowledged: true });

      const finalCart = { user: "u1", items: [{ product: "p1", qty: 7 }] };
      getByUserId.mockResolvedValue(finalCart);

      const result = await service.updateQty("u1", "p1", 7);

      expect(upsert).toHaveBeenCalledTimes(1);
      expect(cartUpdateOne).toHaveBeenCalledTimes(1);

      // Ensure arrayFilters contains productId
      const args = cartUpdateOne.mock.calls[0];
      expect(args[0]).toEqual({ user: "u1" });
      expect(args[2]).toMatchObject({ arrayFilters: [{ "i.product": "p1" }] });

      expect(result).toEqual(finalCart);
    });
  });

  describe("removeItem()", () => {
    it("pulls item from cart", async () => {
      upsert.mockResolvedValue({ user: "u1", items: [] });

      const result = await service.removeItem("u1", "p1");

      expect(upsert).toHaveBeenCalledTimes(1);
      const payload = upsert.mock.calls[0][1];
      expect(payload.$pull).toEqual({ items: { product: "p1" } });

      expect(result).toEqual({ user: "u1", items: [] });
    });
  });

  describe("clearCart()", () => {
    it("calls repo.clear", async () => {
      clear.mockResolvedValue({ user: "u1", items: [] });

      const result = await service.clearCart("u1");

      expect(clear).toHaveBeenCalledWith("u1");
      expect(result).toEqual({ user: "u1", items: [] });
    });
  });
});