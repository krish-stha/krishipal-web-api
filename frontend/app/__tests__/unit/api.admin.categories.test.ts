 // <-- use your real path
import { adminCreateCategory, adminDeleteCategory, adminListCategories, adminUpdateCategory } from "@/lib/api/admin/category";
import { api } from "@/lib/api/axios";
import { endpoints } from "@/lib/api/endpoints";

jest.mock("@/lib/api/axios", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/lib/api/endpoints", () => ({
  endpoints: {
    admin: {
      categories: "/admin/categories",
      categoryById: (id: string) => `/admin/categories/${id}`,
    },
  },
}));

const apiMock = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

describe("admin/categories api", () => {
  beforeEach(() => jest.clearAllMocks());

  test("adminListCategories GET", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

    const out = await adminListCategories();

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.categories);
    expect(out).toEqual({ success: true, data: [] });
  });

  test("adminCreateCategory POST", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { success: true } });

    const payload = { name: "Seeds", parentId: null, isActive: true };
    const out = await adminCreateCategory(payload);

    expect(apiMock.post).toHaveBeenCalledWith(endpoints.admin.categories, payload);
    expect(out).toEqual({ success: true });
  });

  test("adminUpdateCategory PUT", async () => {
    apiMock.put.mockResolvedValueOnce({ data: { success: true } });

    const out = await adminUpdateCategory("123", { name: "New" });

    expect(apiMock.put).toHaveBeenCalledWith(endpoints.admin.categoryById("123"), { name: "New" });
    expect(out).toEqual({ success: true });
  });

  test("adminDeleteCategory DELETE", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { success: true } });

    const out = await adminDeleteCategory("123");

    expect(apiMock.delete).toHaveBeenCalledWith(endpoints.admin.categoryById("123"));
    expect(out).toEqual({ success: true });
  });
});