import { adminGetAbout } from "@/lib/api/admin/about";
import { api } from "@/lib/api/axios";

jest.mock("@/lib/api/axios", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

describe("admin/about api", () => {
  beforeEach(() => jest.clearAllMocks());

  test("adminGetAbout calls GET /admin/about and returns res.data", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, data: { title: "About" } } });

    const out = await adminGetAbout();

    expect(apiMock.get).toHaveBeenCalledWith("/admin/about");
    expect(out).toEqual({ success: true, data: { title: "About" } });
  });
});