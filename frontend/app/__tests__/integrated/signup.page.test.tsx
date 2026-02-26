import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ adjust if your path differs
import SignupPage from "@/app/auth/signup/page";

import { mockPush } from "../__mocks__/nextNavigation";
jest.mock("next/navigation", () => require("../__mocks__/nextNavigation"));

// next/link -> anchor
jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// next/image -> img
jest.mock("next/image", () => {
  return ({ alt, ...props }: any) => <img alt={alt} {...props} />;
});

// lucide icons -> simple spans
jest.mock("lucide-react", () => ({
  Eye: (p: any) => <span data-icon="eye" {...p} />,
  EyeOff: (p: any) => <span data-icon="eyeoff" {...p} />,
  Home: (p: any) => <span data-icon="home" {...p} />,
}));

// UI: Button/Input -> basic HTML
jest.mock("@/app/auth/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
jest.mock("@/app/auth/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

/**
 * Select components: we mock them as a simple <select>
 * - Select renders children and controls value via onValueChange
 * - SelectItem becomes <option>
 * - SelectTrigger/SelectValue/SelectContent are no-ops in tests
 */
jest.mock("@/app/auth/components/ui/select", () => {
  return {
    Select: ({ value, onValueChange, children }: any) => (
      <select
        aria-label="Country Code"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    ),
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
    SelectContent: ({ children }: any) => <>{children}</>,
  };
});

// Toast mock
const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

// Validation rules mock (predictable)
const fullNameValidate = jest.fn((v: string) => (!v ? "Full name required" : ""));
const emailValidate = jest.fn((v: string) => (!v.includes("@") ? "Invalid email" : ""));
const phoneValidate = jest.fn((v: string) => (!v ? "Phone required" : ""));
const addressValidate = jest.fn((v: string) => (!v ? "Address required" : ""));
const passwordValidate = jest.fn((v: string) => (v.length < 6 ? "Password too short" : ""));
const passwordMatchValidate = jest.fn((p: string, c: string) =>
  p !== c ? "Passwords do not match" : ""
);

jest.mock("@/lib/validation", () => ({
  validationRules: {
    fullName: { validate: (v: string) => fullNameValidate(v) },
    email: { validate: (v: string) => emailValidate(v) },
    phone: { validate: (v: string) => phoneValidate(v) },
    address: { validate: (v: string) => addressValidate(v) },
    password: { validate: (v: string) => passwordValidate(v) },
    passwordMatch: { validate: (p: string, c: string) => passwordMatchValidate(p, c) },
  },
}));

describe("SignupPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockReset();
  });

  test("renders core UI + links", () => {
    render(<SignupPage />);

    expect(screen.getByText("KrishiPal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /sign in here/i })).toHaveAttribute("href", "/auth/login");

    expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });



  test("successful signup shows success toast and redirects to login after 1500ms", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    // mock fetch OK
    (global.fetch as any) = jest.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    }));

    render(<SignupPage />);

    // Fill all fields
    await user.type(screen.getByPlaceholderText("Full Name"), "Krish Shrestha");
    await user.type(screen.getByPlaceholderText("Email"), "krish@example.com");

    // Select country code (mocked as select)
    await user.selectOptions(screen.getByLabelText("Country Code"), "+977");

    await user.type(screen.getByPlaceholderText("Phone Number"), "9812345678");
    await user.type(screen.getByPlaceholderText("Address"), "Kathmandu");
    await user.type(screen.getByPlaceholderText("Password"), "123456");
    await user.type(screen.getByPlaceholderText("Confirm Password"), "123456");

    await user.click(screen.getByRole("button", { name: /register/i }));

    // fetch called with correct payload
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(String(url)).toContain("/auth/register");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body).toEqual({
      fullName: "Krish Shrestha",
      email: "krish@example.com",
      countryCode: "+977",
      phone: "9812345678",
      address: "Kathmandu",
      password: "123456",
    });

    // success toast
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Registration Successful",
      })
    );

    // redirect after 1500ms
    expect(mockPush).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1500);
    expect(mockPush).toHaveBeenCalledWith("/auth/login");

    jest.useRealTimers();
  });

  test("API error (response not ok) shows Registration Failed toast", async () => {
    const user = userEvent.setup();

    (global.fetch as any) = jest.fn(async () => ({
      ok: false,
      json: async () => ({ message: "Email already exists" }),
    }));

    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText("Full Name"), "Krish");
    await user.type(screen.getByPlaceholderText("Email"), "krish@example.com");
    await user.selectOptions(screen.getByLabelText("Country Code"), "+977");
    await user.type(screen.getByPlaceholderText("Phone Number"), "9812345678");
    await user.type(screen.getByPlaceholderText("Address"), "Kathmandu");
    await user.type(screen.getByPlaceholderText("Password"), "123456");
    await user.type(screen.getByPlaceholderText("Confirm Password"), "123456");

    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Registration Failed",
        description: "Email already exists",
      })
    );

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("network error shows Network Error toast", async () => {
    const user = userEvent.setup();

    (global.fetch as any) = jest.fn(async () => {
      throw new Error("network down");
    });

    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText("Full Name"), "Krish");
    await user.type(screen.getByPlaceholderText("Email"), "krish@example.com");
    await user.selectOptions(screen.getByLabelText("Country Code"), "+977");
    await user.type(screen.getByPlaceholderText("Phone Number"), "9812345678");
    await user.type(screen.getByPlaceholderText("Address"), "Kathmandu");
    await user.type(screen.getByPlaceholderText("Password"), "123456");
    await user.type(screen.getByPlaceholderText("Confirm Password"), "123456");

    await user.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Network Error",
        })
      );
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});