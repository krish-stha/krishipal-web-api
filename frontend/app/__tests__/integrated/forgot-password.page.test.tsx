import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ adjust path if needed
import ForgotPasswordPage from "@/app/auth/forgot-password/page";

const forgotPasswordApiMock = jest.fn();
jest.mock("@/lib/api/auth", () => ({
  forgotPasswordApi: (email: string) => forgotPasswordApiMock(email),
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

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders form + back to login link", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to login/i })).toHaveAttribute(
      "href",
      "/auth/login"
    );
  });

  test("shows validation error for empty email and does not call API", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    // uses your real validationRules.email -> "Email is required"
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(forgotPasswordApiMock).not.toHaveBeenCalled();
  });

  test("shows validation error for invalid email and does not call API", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "abc");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    // real message: "Please enter a valid email address"
    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    expect(forgotPasswordApiMock).not.toHaveBeenCalled();
  });

  test("success: calls API and shows done state + back to login link", async () => {
    const user = userEvent.setup();
    forgotPasswordApiMock.mockResolvedValueOnce({ success: true });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => expect(forgotPasswordApiMock).toHaveBeenCalledWith("test@example.com"));

    // done state message
    expect(
      await screen.findByText(/reset link has been sent/i)
    ).toBeInTheDocument();

    // back to login link exists in done state too
    expect(screen.getByRole("link", { name: /back to login/i })).toHaveAttribute(
      "href",
      "/auth/login"
    );
  });

  test("error: shows API error message", async () => {
    const user = userEvent.setup();
    forgotPasswordApiMock.mockRejectedValueOnce({
      response: { data: { message: "User not found" } },
    });

    render(<ForgotPasswordPage />);

    await user.type(screen.getByPlaceholderText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/user not found/i)).toBeInTheDocument();
  });
});