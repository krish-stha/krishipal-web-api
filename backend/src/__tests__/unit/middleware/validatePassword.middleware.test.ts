import { validateStrongPassword } from "../../../middleware/validatePassword.middleware";

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("validateStrongPassword middleware", () => {
  it("returns 400 if password missing", () => {
    const req: any = { body: {} };
    const res = mockRes();
    const next = jest.fn();

    validateStrongPassword(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Password is required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 if password too short", () => {
    const req: any = { body: { password: "Aa1!" } };
    const res = mockRes();
    const next = jest.fn();

    validateStrongPassword(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Password must be at least 8 characters" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for strong password", () => {
    const req: any = { body: { password: "Password@123!" } };
    const res = mockRes();
    const next = jest.fn();

    validateStrongPassword(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});