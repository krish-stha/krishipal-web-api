const verify = jest.fn();

jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  default: {
    verify: (...args: any[]) => verify(...args),
  },
}));

jest.mock("../../../config", () => ({
  JWT_SECRET: "unit-test-secret",
}));

import { protect, type AuthRequest } from "../../../middleware/auth.middleware";

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("protect middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when token is missing", () => {
    const req: any = { headers: {} } as AuthRequest;
    const res = mockRes();
    const next = jest.fn();

    protect(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Not authorized, token missing",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid", () => {
    const req: any = {
      headers: { authorization: "Bearer badtoken" },
    } as AuthRequest;

    const res = mockRes();
    const next = jest.fn();

    verify.mockImplementation(() => {
      throw new Error("invalid");
    });

    protect(req, res as any, next);

    expect(verify).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Not authorized, token invalid",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("sets req.user and calls next() when token is valid", () => {
    const req: any = {
      headers: { authorization: "Bearer goodtoken" },
    } as AuthRequest;

    const res = mockRes();
    const next = jest.fn();

    verify.mockReturnValue({ id: "u1", email: "a@test.com", role: "admin" });

    protect(req, res as any, next);

    expect(req.user).toEqual({ id: "u1", email: "a@test.com", role: "admin" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});