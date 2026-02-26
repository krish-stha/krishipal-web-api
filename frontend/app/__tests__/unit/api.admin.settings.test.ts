import { adminGetSettings, adminUpdateSettings, adminUploadLogo } from "@/lib/api/admin/settings";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

jest.mock("@/lib/api/axios", () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("@/lib/api/endpoints", () => ({
  endpoints: {
    admin: {
      settings: "/admin/settings",
    },
  },
}));

const apiMock = api as unknown as { get: jest.Mock; put: jest.Mock; post: jest.Mock };

describe("admin settings api", () => {
  beforeEach(() => jest.clearAllMocks());

  test("adminGetSettings calls GET settings", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true } });

    await adminGetSettings();

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.settings);
  });

  test("adminUpdateSettings calls PUT settings", async () => {
    apiMock.put.mockResolvedValueOnce({ data: { ok: true } });

    const payload = { storeName: "KrishiPal" };
    await adminUpdateSettings(payload);

    expect(apiMock.put).toHaveBeenCalledWith(endpoints.admin.settings, payload);
  });

  test("adminUploadLogo posts multipart/form-data", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { ok: true } });

    const file = new File(["x"], "logo.png", { type: "image/png" });
    const out = await adminUploadLogo(file);

    expect(apiMock.post).toHaveBeenCalled();
    const [url, fd, config] = apiMock.post.mock.calls[0];

    expect(url).toBe("/admin/settings/logo");
    expect(fd).toBeInstanceOf(FormData);
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    expect(out).toEqual({ data: { ok: true } }); // returns api.post(...) promise
  });
});