import { adminOnly, selfOrAdmin } from "../../../middleware/admin.middleware";

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("admin middleware", () => {
  it("adminOnly blocks non-admin", () => {
    const req: any = { user: { id: "u1", role: "user" } };
    const res = mockRes();
    const next = jest.fn();

    adminOnly(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Admin access only",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("adminOnly allows admin", () => {
    const req: any = { user: { id: "u1", role: "admin" } };
    const res = mockRes();
    const next = jest.fn();

    adminOnly(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("selfOrAdmin allows admin for any id", () => {
    const req: any = { user: { id: "u1", role: "admin" }, params: { id: "x" } };
    const res = mockRes();
    const next = jest.fn();

    selfOrAdmin(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("selfOrAdmin allows user for own id", () => {
    const req: any = { user: { id: "u1", role: "user" }, params: { id: "u1" } };
    const res = mockRes();
    const next = jest.fn();

    selfOrAdmin(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("selfOrAdmin blocks user for different id", () => {
    const req: any = { user: { id: "u1", role: "user" }, params: { id: "u2" } };
    const res = mockRes();
    const next = jest.fn();

    selfOrAdmin(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden",
    });
    expect(next).not.toHaveBeenCalled();
  });
});