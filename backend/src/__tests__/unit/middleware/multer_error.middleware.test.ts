import multer from "multer";
import { multerErrorHandler } from "../../../middleware/multer_error.middleware";

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("multerErrorHandler", () => {
  it("calls next() when err is falsy", () => {
    const next = jest.fn();
    const res = mockRes();

    multerErrorHandler(null, {} as any, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("returns 400 for MulterError", () => {
    const next = jest.fn();
    const res = mockRes();

    const err = new multer.MulterError("LIMIT_FILE_SIZE");
    // err.message is set by multer

    multerErrorHandler(err, {} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: err.message,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 for normal Error with message", () => {
    const next = jest.fn();
    const res = mockRes();

    const err = new Error("Something bad");

    multerErrorHandler(err, {} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Something bad",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 with fallback message when err.message missing", () => {
    const next = jest.fn();
    const res = mockRes();

    const err: any = { whatever: true };

    multerErrorHandler(err, {} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Upload failed",
    });
    expect(next).not.toHaveBeenCalled();
  });
});