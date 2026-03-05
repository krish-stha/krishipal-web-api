import { adminUpdateAbout, adminUploadMissionImage, adminUploadVisionImage } from "@/lib/api/admin/about";
import { api } from "@/lib/api/axios";

// ⚠️ adjust import path to your real file that exports these

jest.mock("@/lib/api/axios", () => ({
  api: {
    put: jest.fn(),
    post: jest.fn(),
  },
}));

const apiMock = api as unknown as { put: jest.Mock; post: jest.Mock };

describe("admin about update/uploads api", () => {
  beforeEach(() => jest.clearAllMocks());

  test("adminUpdateAbout PUT /admin/about returns res.data", async () => {
    apiMock.put.mockResolvedValueOnce({ data: { success: true } });

    const out = await adminUpdateAbout({ title: "Hello" });

    expect(apiMock.put).toHaveBeenCalledWith("/admin/about", { title: "Hello" });
    expect(out).toEqual({ success: true });
  });

  test("adminUploadMissionImage posts multipart", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    const file = new File(["x"], "m.png", { type: "image/png" });
    const out = await adminUploadMissionImage(file);

    expect(apiMock.post).toHaveBeenCalled();
    const [url, fd, config] = apiMock.post.mock.calls[0];

    expect(url).toBe("/admin/about/mission-image");
    expect(fd).toBeInstanceOf(FormData);
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    expect(out).toEqual({ success: true });
  });

  test("adminUploadVisionImage posts multipart", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    const file = new File(["x"], "v.png", { type: "image/png" });
    const out = await adminUploadVisionImage(file);

    const [url, fd, config] = apiMock.post.mock.calls[0];

    expect(url).toBe("/admin/about/vision-image");
    expect(fd).toBeInstanceOf(FormData);
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
    expect(out).toEqual({ success: true });
  });
});