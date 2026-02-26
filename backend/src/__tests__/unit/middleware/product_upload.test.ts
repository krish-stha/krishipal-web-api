describe("product_upload.ts", () => {
  it("creates folder when missing", async () => {
    const mkdirSync = jest.fn();
    const existsSync = jest.fn().mockReturnValue(false);

    const multerMock: any = jest.fn(() => ({ __multer: true }));
    multerMock.diskStorage = jest.fn((opts: any) => ({ __storage: true, opts }));
    multerMock.MulterError = class MulterError extends Error {};

    jest.resetModules();

    // ✅ doMock is NOT hoisted
    jest.doMock("fs", () => ({
      __esModule: true,
      default: { existsSync, mkdirSync }, // for: import fs from "fs"
      existsSync,
      mkdirSync,
    }));

    jest.doMock("multer", () => ({
      __esModule: true,
      default: multerMock,
    }));

    await jest.isolateModulesAsync(async () => {
      await import("../../../middleware/product_upload");
    });

    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync.mock.calls[0][1]).toEqual({ recursive: true });
  });

  it("exports uploadProductImages and configures multer", async () => {
    const mkdirSync = jest.fn();
    const existsSync = jest.fn().mockReturnValue(true);

    const multerMock: any = jest.fn(() => ({ __multer: true }));
    multerMock.diskStorage = jest.fn((opts: any) => ({ __storage: true, opts }));
    multerMock.MulterError = class MulterError extends Error {};

    jest.resetModules();

    jest.doMock("fs", () => ({
      __esModule: true,
      default: { existsSync, mkdirSync },
      existsSync,
      mkdirSync,
    }));

    jest.doMock("multer", () => ({
      __esModule: true,
      default: multerMock,
    }));

    let mod: any;
    await jest.isolateModulesAsync(async () => {
      mod = await import("../../../middleware/product_upload");
    });

    expect(mod.uploadProductImages).toBeDefined();
    expect(multerMock).toHaveBeenCalledTimes(1);

    const opts = multerMock.mock.calls[0][0];
    expect(opts.limits).toEqual({ fileSize: 3 * 1024 * 1024 });
    expect(typeof opts.fileFilter).toBe("function");
    expect(multerMock.diskStorage).toHaveBeenCalledTimes(1);
  });
});