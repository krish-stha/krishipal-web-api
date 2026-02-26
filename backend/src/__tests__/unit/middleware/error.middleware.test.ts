import { errorHandler } from "../../../middleware/error.middleware";
import { HttpError } from "../../../errors/http-error";

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("errorHandler middleware", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as any).mockRestore?.();
  });

  it("handles HttpError with correct status + message", () => {
    const err = new HttpError(409, "Email already registered");
    const res = mockRes();

    errorHandler(err, {} as any, res as any, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email already registered",
    });
  });

  it("handles mongoose ValidationError as 400 with joined messages", () => {
    const err: any = {
      name: "ValidationError",
      errors: {
        a: { message: "A is required" },
        b: { message: "B must be number" },
      },
    };

    const res = mockRes();

    errorHandler(err, {} as any, res as any, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "A is required, B must be number",
    });
  });

  it("handles unknown errors as 500", () => {
    const err = new Error("boom");
    const res = mockRes();

    errorHandler(err, {} as any, res as any, (() => {}) as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });
  });
});