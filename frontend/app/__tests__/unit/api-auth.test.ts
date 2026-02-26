import { loginApi, forgotPasswordApi, resetPasswordApi } from "@/lib/api/auth";

// Mock api client so axios env never runs
const postMock = jest.fn();

jest.mock("@/lib/api/axios", () => ({
  api: { post: (...args: any[]) => postMock(...args) },
}));

jest.mock("@/lib/api/endpoints", () => ({
  endpoints: {
    auth: {
      login: "/auth/login",
      forgotPassword: "/auth/forgot-password",
      resetPassword: "/auth/reset-password",
    },
  },
}));

const setAuthCookiesMock = jest.fn();
jest.mock("@/lib/cookie", () => ({
  setAuthCookies: (...args: any[]) => setAuthCookiesMock(...args),
}));

describe("lib/api/auth.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loginApi calls endpoint, sets cookies, returns normalized user", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        token: "tok123",
        user: {
          _id: "mongoid1",
          email: "a@b.com",
          fullName: "A B",
          role: "admin",
        },
      },
    });

    const user = await loginApi("a@b.com", "pass");

    expect(postMock).toHaveBeenCalledWith("/auth/login", {
      email: "a@b.com",
      password: "pass",
    });

    expect(setAuthCookiesMock).toHaveBeenCalledWith(
      {
        id: "mongoid1",
        email: "a@b.com",
        name: "A B",
        role: "admin",
      },
      "tok123"
    );

    expect(user).toEqual({
      id: "mongoid1",
      email: "a@b.com",
      name: "A B",
      role: "admin",
    });
  });

  test("loginApi falls back to user.id when _id not present", async () => {
    postMock.mockResolvedValueOnce({
      data: {
        success: true,
        token: "tok456",
        user: {
          id: "id2",
          email: "u@x.com",
          fullName: "User X",
          role: "user",
        },
      },
    });

    const user = await loginApi("u@x.com", "pass");

    expect(user.id).toBe("id2");
    expect(setAuthCookiesMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "id2" }),
      "tok456"
    );
  });

  test("forgotPasswordApi posts email and returns res.data", async () => {
    postMock.mockResolvedValueOnce({ data: { success: true, message: "sent" } });

    const res = await forgotPasswordApi("x@y.com");

    expect(postMock).toHaveBeenCalledWith("/auth/forgot-password", { email: "x@y.com" });
    expect(res).toEqual({ success: true, message: "sent" });
  });

  test("resetPasswordApi posts token+password and returns res.data", async () => {
    postMock.mockResolvedValueOnce({ data: { success: true, message: "ok" } });

    const res = await resetPasswordApi("token123", "newpass");

    expect(postMock).toHaveBeenCalledWith("/auth/reset-password", {
      token: "token123",
      password: "newpass",
    });
    expect(res).toEqual({ success: true, message: "ok" });
  });
});