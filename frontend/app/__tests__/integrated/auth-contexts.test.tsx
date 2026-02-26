import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ IMPORTANT: adjust this import if your file path differs
import { AuthProvider, useAuth } from "@/lib/contexts/auth-contexts";

// ----- next/navigation mock -----
import { mockPush } from "../__mocks__/nextNavigation";
jest.mock("next/navigation", () => require("../__mocks__/nextNavigation"));

// ----- cookie helpers mock -----
const getUserMock = jest.fn();
const clearAuthCookiesMock = jest.fn();
const updateUserCookieMock = jest.fn();

jest.mock("@/lib/cookie", () => ({
  getUser: () => getUserMock(),
  clearAuthCookies: () => clearAuthCookiesMock(),
  updateUserCookie: (v: any) => updateUserCookieMock(v),
}));

// ----- login api mock -----
const loginApiMock = jest.fn();
jest.mock("@/lib/api/auth", () => ({
  loginApi: (email: string, password: string) => loginApiMock(email, password),
}));

// ----- axios api mock -----
const apiGetMock = jest.fn();
jest.mock("@/lib/api/axios", () => ({
  api: { get: (...args: any[]) => apiGetMock(...args) },
}));

// ----- endpoints mock -----
jest.mock("@/lib/api/endpoints", () => ({
  endpoints: { auth: { me: "/auth/me" } },
}));

// A tiny test component to call context methods
function TestHarness() {
  const { user, login, logout, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="user-email">{user?.email ?? ""}</div>
      <div data-testid="user-role">{user?.role ?? ""}</div>

      <button onClick={() => login("test@example.com", "123456")}>DoLogin</button>
      <button onClick={() => logout()}>DoLogout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockReset();

    // default: no user in cookie
    getUserMock.mockReturnValue(null);
  });

  test("loads initial user from cookie via getUser()", async () => {
    getUserMock.mockReturnValue({
      id: "u1",
      email: "cookie@example.com",
      name: "Cookie User",
      role: "user",
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    // initial effect runs after mount
    await waitFor(() => {
      expect(screen.getByTestId("user-email")).toHaveTextContent("cookie@example.com");
      expect(screen.getByTestId("user-role")).toHaveTextContent("user");
    });

    // isLoading becomes false after effect
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  test("login redirects admin to /admin/users and updates cookie if /me has profile_picture", async () => {
    // loginApi returns minimal user
    loginApiMock.mockResolvedValueOnce({
      id: "a1",
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
    });

    // /me returns profile data
    apiGetMock.mockResolvedValueOnce({
      data: {
        data: {
          profile_picture: "admin.png",
          fullName: "Admin Full",
          email: "admin@example.com",
        },
      },
    });

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "DoLogin" }));

    await waitFor(() => {
      expect(loginApiMock).toHaveBeenCalledWith("test@example.com", "123456");
    });

    await waitFor(() => {
      // cookie updated because profile_picture exists
      expect(updateUserCookieMock).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_picture: "admin.png",
          name: "Admin Full",
          email: "admin@example.com",
        })
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/users");
    });
  });

  test("login redirects user to / (and /me failing still allows redirect)", async () => {
    loginApiMock.mockResolvedValueOnce({
      id: "u2",
      email: "user@example.com",
      name: "User",
      role: "user",
    });

    // /me fails → should not block login
    apiGetMock.mockRejectedValueOnce(new Error("me failed"));

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "DoLogin" }));

    await waitFor(() => {
      expect(loginApiMock).toHaveBeenCalledWith("test@example.com", "123456");
    });

    // No cookie update expected when /me fails
    expect(updateUserCookieMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("logout clears cookies and redirects to /auth/login", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "DoLogout" }));

    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});