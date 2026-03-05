describe("upload.ts", () => {
  it("creates profile_photo folder when missing", async () => {
    const mkdirSync = jest.fn();
    const existsSync = jest.fn().mockReturnValue(false);

    const multerMock: any = jest.fn(() => ({ __multer: true }));
    multerMock.diskStorage = jest.fn((opts: any) => ({ __storage: true, opts }));
    multerMock.MulterError = class MulterError extends Error {};

    jest.resetModules();

    // ✅ provide named exports (for: import * as fs from "fs")
    // also provide default to be safe in TS interop
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

    await jest.isolateModulesAsync(async () => {
      await import("../../../middleware/upload");
    });

    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync.mock.calls[0][1]).toEqual({ recursive: true });
  });

  it("fileFilter rejects wrong field name", async () => {
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
      mod = await import("../../../middleware/upload");
    });

    const opts = multerMock.mock.calls[0][0];
    const cb = jest.fn();

    opts.fileFilter(
      {} as any,
      { fieldname: "wrong", mimetype: "image/png" } as any,
      cb
    );

    const [err, ok] = cb.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect(String(err.message)).toContain("Use profilePicture");
    expect(ok).toBeUndefined();
  });
});