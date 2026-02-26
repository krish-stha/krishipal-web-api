// app/__tests__/integrated/contact.page.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import ContactPage from "@/app/user/dashboard/contact/page";
import { getPublicSettings } from "@/lib/api/settings";

jest.mock("@/app/user/component/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
jest.mock("@/app/user/component/footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

jest.mock("lucide-react", () => ({
  Phone: (p: any) => <svg data-testid="icon-phone" {...p} />,
  Mail: (p: any) => <svg data-testid="icon-mail" {...p} />,
  MapPin: (p: any) => <svg data-testid="icon-map" {...p} />,
}));

jest.mock("@/lib/api/settings", () => ({
  getPublicSettings: jest.fn(),
}));

const getPublicSettingsMock = getPublicSettings as jest.Mock;

describe("ContactPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders default fallback contact info first", () => {
    getPublicSettingsMock.mockRejectedValueOnce(new Error("fail"));

    render(<ContactPage />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    // fallback text from component
    expect(screen.getByText("+1 123 456 7890")).toBeInTheDocument();
    expect(screen.getByText("info@krishipal.com")).toBeInTheDocument();
    expect(screen.getByText("123 Kathmandu, Nepal, 44600")).toBeInTheDocument();
  });

  test("renders contact info from settings API", async () => {
    getPublicSettingsMock.mockResolvedValueOnce({
      data: {
        storePhone: "+977 9800000000",
        storeEmail: "hello@krishipal.com",
        storeAddress: "Birtamode, Jhapa",
      },
    });

    render(<ContactPage />);

    // ✅ wait for async useEffect state update (prevents act warning)
    expect(await screen.findByText("+977 9800000000")).toBeInTheDocument();
    expect(await screen.findByText("hello@krishipal.com")).toBeInTheDocument();
    expect(await screen.findByText("Birtamode, Jhapa")).toBeInTheDocument();
  });
});