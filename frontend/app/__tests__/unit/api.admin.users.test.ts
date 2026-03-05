import {
  adminListUsers,
  adminGetUserById,
  adminCreateUser,
  adminUpdateUser,
  adminSoftDeleteUser,
  adminHardDeleteUser,
} from "@/lib/api/admin/user";
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
      users: "/admin/users",
      userById: (id: string) => `/admin/users/${id}`,
      hardDelete: (id: string) => `/admin/users/${id}/hard`,
    },
  },
}));

const apiMock = api as unknown as { get: jest.Mock; post: jest.Mock; put: jest.Mock; delete: jest.Mock };

describe("admin users api", () => {
  beforeEach(() => jest.clearAllMocks());

  test("adminListUsers builds query string", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true } });

    const out = await adminListUsers({ page: 2, limit: 10 });

    expect(apiMock.get).toHaveBeenCalledWith("/admin/users?page=2&limit=10");
    expect(out).toEqual({ success: true });
  });

  test("adminListUsers without params uses base", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { success: true } });

    await adminListUsers();

    expect(apiMock.get).toHaveBeenCalledWith("/admin/users");
  });

  test("adminGetUserById", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { ok: true } });

    const out = await adminGetUserById("u1");

    expect(apiMock.get).toHaveBeenCalledWith(endpoints.admin.userById("u1"));
    expect(out).toEqual({ ok: true });
  });

  test("adminCreateUser", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { ok: true } });

    const fd = new FormData();
    fd.append("fullName", "A");

    const out = await adminCreateUser(fd);

    expect(apiMock.post).toHaveBeenCalledWith(endpoints.admin.users, fd);
    expect(out).toEqual({ ok: true });
  });

  test("adminUpdateUser", async () => {
    apiMock.put.mockResolvedValueOnce({ data: { ok: true } });

    const fd = new FormData();
    fd.append("fullName", "B");

    const out = await adminUpdateUser("u2", fd);

    expect(apiMock.put).toHaveBeenCalledWith(endpoints.admin.userById("u2"), fd);
    expect(out).toEqual({ ok: true });
  });

  test("adminSoftDeleteUser", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { ok: true } });

    const out = await adminSoftDeleteUser("u3");

    expect(apiMock.delete).toHaveBeenCalledWith(endpoints.admin.userById("u3"));
    expect(out).toEqual({ ok: true });
  });

  test("adminHardDeleteUser", async () => {
    apiMock.delete.mockResolvedValueOnce({ data: { ok: true } });

    const out = await adminHardDeleteUser("u4");

    expect(apiMock.delete).toHaveBeenCalledWith(endpoints.admin.hardDelete("u4"));
    expect(out).toEqual({ ok: true });
  });
});