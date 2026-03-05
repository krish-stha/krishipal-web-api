// app/__tests__/integrated/orders.page.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyOrdersPage from "@/app/user/dashboard/orders/page";
import { getMyOrders } from "@/lib/api/order";

jest.mock("@/app/user/component/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
jest.mock("@/app/user/component/footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));
jest.mock("@/app/auth/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));
jest.mock("@/app/auth/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock("@/lib/api/order", () => ({
  getMyOrders: jest.fn(),
}));

const getMyOrdersMock = getMyOrders as jest.Mock;

describe("MyOrdersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders orders after fetch", async () => {
    getMyOrdersMock.mockResolvedValueOnce({
      data: [
        {
          _id: "order1",
          items: [{}, {}],
          total: 200,
          status: "pending",
          createdAt: "2026-02-01T10:00:00.000Z",
        },
      ],
      meta: { total: 1 },
    });

    render(<MyOrdersPage />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();

    // ✅ Don't assert loading (can be too fast); assert final state
    expect(await screen.findByText("order1")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText(/rs\.\s*200/i)).toBeInTheDocument();
  });

  test("shows error when API fails (uses thrown message)", async () => {
    getMyOrdersMock.mockRejectedValueOnce(new Error("boom"));

    render(<MyOrdersPage />);

    // ✅ component shows e.message if exists (so it shows boom)
    expect(await screen.findByText(/boom/i)).toBeInTheDocument();
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });

  test("pagination: Next calls getMyOrders with page 2", async () => {
    const user = userEvent.setup();

    getMyOrdersMock.mockResolvedValueOnce({
      data: [
        { _id: "order1", items: [], total: 100, status: "pending", createdAt: "2026-02-01T10:00:00.000Z" },
      ],
      meta: { total: 20 }, // totalPages = 2 with limit=10
    });

    render(<MyOrdersPage />);

    expect(await screen.findByText("order1")).toBeInTheDocument();

    // next fetch (page 2)
    getMyOrdersMock.mockResolvedValueOnce({
      data: [{ _id: "order2", items: [], total: 200, status: "confirmed", createdAt: "2026-02-02T10:00:00.000Z" }],
      meta: { total: 20 },
    });

    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(await screen.findByText("order2")).toBeInTheDocument();
    expect(getMyOrdersMock).toHaveBeenCalledWith(2, 10);
  });
});