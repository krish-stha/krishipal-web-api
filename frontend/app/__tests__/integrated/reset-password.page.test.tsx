import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ adjust path if needed
import ResetPasswordPage from "@/app/auth/reset-password/page";

const resetPasswordApiMock = jest.fn();
jest.mock("@/lib/api/auth", () => ({
  resetPasswordApi: (token: string, password: string) =>
    resetPasswordApiMock(token, password),
}));

// next/link -> anchor
jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// UI components -> stable HTML
jest.mock("@/app/auth/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock("@/app/auth/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

// lucide icons mock
jest.mock("lucide-react", () => ({
  Eye: (p: any) => <span data-icon="eye" {...p} />,
  EyeOff: (p: any) => <span data-icon="eyeoff" {...p} />,
}));

/**
 * next/navigation mock specifically for this test:
 * we need router.push + useSearchParams.get("token")
 */
const mockPush = jest.fn();
let tokenValue: string | null = null;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: jest.fn(), back: jest.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? tokenValue : null),
    toString: () => (tokenValue ? `token=${encodeURIComponent(tokenValue)}` : ""),
  }),
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenValue = null;
    mockPush.mockReset();
  });

  test("token missing: shows token missing alert and disables submit", () => {
    tokenValue = null;
    render(<ResetPasswordPage />);

    expect(screen.getByText(/token missing/i)).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: /reset password/i });
    expect(btn).toBeDisabled();
  });

  test("token present: can type password and toggle visibility", async () => {
    const user = userEvent.setup();
    tokenValue = "abc123";

    render(<ResetPasswordPage />);

    const pass = screen.getByPlaceholderText(/new password/i) as HTMLInputElement;
    expect(pass.type).toBe("password");

    // toggle button is type=button and unlabeled; grab by role with empty name
    const toggle = screen.getByRole("button", { name: "" });
    await user.click(toggle);

    expect(pass.type).toBe("text");
  });

  test("invalid password shows real validation error and does not call API", async () => {
    const user = userEvent.setup();
    tokenValue = "abc123";

    render(<ResetPasswordPage />);

    // too short and missing requirements -> your validation will return first failing message
    await user.type(screen.getByPlaceholderText(/new password/i), "abc");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    // real password rule message from your validation:
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(resetPasswordApiMock).not.toHaveBeenCalled();
  });

  test("success: calls API, shows done UI, redirects to login after 800ms", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    tokenValue = "abc123";
    resetPasswordApiMock.mockResolvedValueOnce({ success: true });

    render(<ResetPasswordPage />);

    // valid password (meets your rules)
    await user.type(screen.getByPlaceholderText(/new password/i), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(resetPasswordApiMock).toHaveBeenCalledWith("abc123", "Abcdef1!");
    });

    expect(await screen.findByText(/password reset successful/i)).toBeInTheDocument();

    // redirect after 800ms
    expect(mockPush).not.toHaveBeenCalled();
    jest.advanceTimersByTime(800);
    expect(mockPush).toHaveBeenCalledWith("/auth/login");

    jest.useRealTimers();
  });

  test("API error: shows message and does not redirect", async () => {
    const user = userEvent.setup();
    tokenValue = "abc123";

    resetPasswordApiMock.mockRejectedValueOnce({
      response: { data: { message: "Token expired" } },
    });

    render(<ResetPasswordPage />);

    await user.type(screen.getByPlaceholderText(/new password/i), "Abcdef1!");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText(/token expired/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});