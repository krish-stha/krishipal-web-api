import { AddToCartDTO, UpdateCartItemDTO } from "../../../dtos/cart.dto";

describe("AddToCartDTO", () => {
  it("accepts valid payload", () => {
    const r = AddToCartDTO.safeParse({ productId: "p1", qty: 2 });
    expect(r.success).toBe(true);
  });

  it("defaults qty to 1 when missing", () => {
    const r = AddToCartDTO.safeParse({ productId: "p1" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.qty).toBe(1);
  });

  it("rejects empty productId", () => {
    const r = AddToCartDTO.safeParse({ productId: "", qty: 1 });
    expect(r.success).toBe(false);
  });

  it("rejects qty < 1", () => {
    const r = AddToCartDTO.safeParse({ productId: "p1", qty: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects qty > 99", () => {
    const r = AddToCartDTO.safeParse({ productId: "p1", qty: 100 });
    expect(r.success).toBe(false);
  });

  it("rejects non-integer qty", () => {
    const r = AddToCartDTO.safeParse({ productId: "p1", qty: 1.5 });
    expect(r.success).toBe(false);
  });
});

describe("UpdateCartItemDTO", () => {
  it("accepts valid qty", () => {
    const r = UpdateCartItemDTO.safeParse({ qty: 5 });
    expect(r.success).toBe(true);
  });

  it("rejects missing qty", () => {
    const r = UpdateCartItemDTO.safeParse({});
    expect(r.success).toBe(false);
  });

  it("rejects qty < 1", () => {
    const r = UpdateCartItemDTO.safeParse({ qty: 0 });
    expect(r.success).toBe(false);
  });

  it("rejects qty > 99", () => {
    const r = UpdateCartItemDTO.safeParse({ qty: 999 });
    expect(r.success).toBe(false);
  });

  it("rejects non-integer qty", () => {
    const r = UpdateCartItemDTO.safeParse({ qty: 2.2 });
    expect(r.success).toBe(false);
  });
});