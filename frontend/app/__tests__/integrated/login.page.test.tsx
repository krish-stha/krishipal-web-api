import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// IMPORTANT: adjust import path to YOUR login page file location
// Example: if your page is at app/auth/login/page.tsx:
import LoginPage from "@/app/auth/login/page";

// ----- next/navigation mock -----
import {
  mockReplace,
  __setNextParam,
} from "../__mocks__/nextNavigation";

jest.mock("next/navigation", () => require("../__mocks__/nextNavigation"));

// ----- next/link mock (render as <a>) -----
jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// ----- next/image mock (render as <img>) -----
jest.mock("next/image", () => {
  return ({ alt, ...props }: any) => <img alt={alt} {...props} />;
});

// ----- lucide icons mock (avoid svg complexity) -----
jest.mock("lucide-react", () => ({
  Eye: (p: any) => <span data-icon="eye" {...p} />,
  EyeOff: (p: any) => <span data-icon="eyeoff" {...p} />,
  Home: (p: any) => <span data-icon="home" {...p} />,
}));

// ----- mock UI components to stable HTML -----
jest.mock("@/app/auth/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock("@/app/auth/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

// ----- mock validation rules -----
const emailValidate = jest.fn((v: string) => {
  if (!v) return "Email is required";
  if (!v.includes("@")) return "Invalid email";
  return "";
});
const passwordValidate = jest.fn((v: string) => {
  if (!v) return "Password is required";
  if (v.length < 6) return "Password must be at least 6 characters";
  return "";
});

jest.mock("@/lib/validation", () => ({
  validationRules: {
    email: { validate: (v: string) => emailValidate(v) },
    password: { validate: (v: string) => passwordValidate(v) },
  },
}));

// ----- mock auth context -----
const loginMock = jest.fn();

jest.mock("@/lib/contexts/auth-contexts", () => ({
  useAuth: () => ({ login: loginMock }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    __setNextParam(null);
    loginMock.mockReset();
    mockReplace.mockReset();
  });

  test("renders essential UI links/text", () => {
    render(<LoginPage />);

    expect(screen.getByText("KrishiPal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");

    expect(screen.getByRole("link", { name: /forgot password\?/i }))
      .toHaveAttribute("href", "/auth/forgot-password");

    expect(screen.getByRole("link", { name: /sign up here/i }))
      .toHaveAttribute("href", "/auth/signup");

    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("shows validation errors and does NOT call login when invalid", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  const emailInput = screen.getByPlaceholderText("Email");
  const passwordInput = screen.getByPlaceholderText("Password");

  await user.type(emailInput, "abc");     // invalid email -> shows message
  await user.type(passwordInput, "123");  // invalid password -> disables submit, but no text shown in UI

  const btn = screen.getByRole("button", { name: /login/i });
  expect(btn).toBeDisabled();

  // Try submit (Enter)
  await user.keyboard("{Enter}");

  expect(loginMock).not.toHaveBeenCalled();

  // ✅ Only assert what your UI actually shows
  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});

  test("successful login redirects to next param if provided", async () => {
    const user = userEvent.setup();
    __setNextParam("/admin/dashboard");

    loginMock.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Email"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "123456");

    const btn = screen.getByRole("button", { name: /login/i });
    expect(btn).toBeEnabled();

    await user.click(btn);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("test@example.com", "123456");
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  test("successful login redirects to / when no next param", async () => {
    const user = userEvent.setup();
    __setNextParam(null);

    loginMock.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Email"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "123456");

    await user.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  test("shows friendly error message on 401", async () => {
    const user = userEvent.setup();

    loginMock.mockRejectedValueOnce({ response: { status: 401 } });

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText("Email"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "123456");

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/email or password is incorrect/i)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  test("toggle password visibility changes input type", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText("Password") as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    // the toggle button is the only type="button" in the form
    const toggle = screen.getByRole("button", { name: "" });
    await user.click(toggle);

    expect(passwordInput.type).toBe("text");
  });
});