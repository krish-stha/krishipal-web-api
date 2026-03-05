import { CartRepository } from "../../../repositories/cart.repository";

// ✅ Mock CartModel module used inside repository
jest.mock("../../../models/cart.model", () => {
  const chain = () => ({
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue({ ok: true }),
  });

  return {
    __esModule: true,
    CartModel: {
      findOne: jest.fn(() => chain()),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(() => chain()),
    },
  };
});

import { CartModel } from "../../../models/cart.model";

describe("CartRepository", () => {
  const repo = new CartRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getByUserId: calls findOne + populate + lean", async () => {
    const res = await repo.getByUserId("u1");

    expect(CartModel.findOne).toHaveBeenCalledWith({ user: "u1" });

    // verify chain methods were called
    const chainObj = (CartModel.findOne as jest.Mock).mock.results[0].value;
    expect(chainObj.populate).toHaveBeenCalledTimes(1);
    expect(chainObj.lean).toHaveBeenCalledTimes(1);

    expect(res).toEqual({ ok: true });
  });

  it("createForUser: creates empty cart", async () => {
    (CartModel.create as jest.Mock).mockResolvedValue({ _id: "c1" });

    const res = await repo.createForUser("u2");

    expect(CartModel.create).toHaveBeenCalledWith({ user: "u2", items: [] });
    expect(res).toEqual({ _id: "c1" });
  });

  it("upsert: calls findOneAndUpdate with correct options + populate + lean", async () => {
    const update = { $set: { items: [{ product: "p1", qty: 2 }] } };

    const res = await repo.upsert("u3", update);

    expect(CartModel.findOneAndUpdate).toHaveBeenCalledWith(
      { user: "u3" },
      update,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const chainObj = (CartModel.findOneAndUpdate as jest.Mock).mock.results[0].value;
    expect(chainObj.populate).toHaveBeenCalledTimes(1);
    expect(chainObj.lean).toHaveBeenCalledTimes(1);

    expect(res).toEqual({ ok: true });
  });

  it("clear: sets items to [] with validators + populate + lean", async () => {
    const res = await repo.clear("u4");

    expect(CartModel.findOneAndUpdate).toHaveBeenCalledWith(
      { user: "u4" },
      { $set: { items: [] } },
      { new: true, runValidators: true }
    );

    const chainObj = (CartModel.findOneAndUpdate as jest.Mock).mock.results[0].value;
    expect(chainObj.populate).toHaveBeenCalledTimes(1);
    expect(chainObj.lean).toHaveBeenCalledTimes(1);

    expect(res).toEqual({ ok: true });
  });
});