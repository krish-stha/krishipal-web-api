import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ CHANGE to your actual cart page path
import CartPage from "@/app/user/dashboard/cart/page";

import { mockPush } from "../__mocks__/nextNavigation";
jest.mock("next/navigation", () => require("../__mocks__/nextNavigation"));

jest.mock("@/app/user/component/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
jest.mock("@/app/user/component/footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

jest.mock("@/app/auth/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// ---- useCart mock ----
const useCartMock = jest.fn();
jest.mock("@/lib/contexts/cart-context", () => ({
  useCart: () => useCartMock(),
}));

function makeItem(opts: Partial<any> = {}) {
  return {
    product: {
      _id: opts.productId ?? "p1",
      name: opts.name ?? "Product 1",
      sku: opts.sku ?? "SKU1",
      stock: opts.stock ?? 10,
      images: opts.images ?? ["img1.png"],
      category: { name: opts.category ?? "Cat" },
    },
    productId: opts.productId,
    qty: opts.qty ?? 1,
    priceSnapshot: opts.priceSnapshot ?? 100,
    ...opts,
  };
}

describe("CartPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockReset();
  });

  test("shows empty cart state", () => {
    useCartMock.mockReturnValue({
      cart: { items: [] },
      count: 0,
      loading: false,
      setQty: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      selectedIds: [],
      isSelected: () => false,
      toggleSelected: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
    });

    render(<CartPage />);

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/items: 0/i)).toBeInTheDocument();
  });

  test("proceed to checkout shows error when no items selected", async () => {
    const user = userEvent.setup();

    const toggleSelected = jest.fn();
    useCartMock.mockReturnValue({
      cart: { items: [makeItem({ productId: "p1", qty: 2, priceSnapshot: 50, stock: 10 })] },
      count: 1,
      loading: false,
      setQty: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      selectedIds: [], // none selected
      isSelected: () => false,
      toggleSelected,
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
    });

    render(<CartPage />);

    await user.click(screen.getByRole("button", { name: /proceed to checkout/i }));

    expect(await screen.findByText(/tick at least 1 item to checkout/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("selected totals are computed only for selected items", async () => {
    // two items: only p1 selected
    useCartMock.mockReturnValue({
      cart: {
        items: [
          makeItem({ productId: "p1", qty: 2, priceSnapshot: 100, stock: 10, name: "A" }), // total 200
          makeItem({ productId: "p2", qty: 1, priceSnapshot: 999, stock: 10, name: "B" }), // not selected
        ],
      },
      count: 2,
      loading: false,
      setQty: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      selectedIds: ["p1"],
      isSelected: (id: string) => id === "p1",
      toggleSelected: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
    });

    render(<CartPage />);

    // Order summary should show selected items = 1
    expect(screen.getByText(/selected items:/i)).toHaveTextContent("Selected items: 1");

    const summary = screen.getByRole("heading", { name: /order summary/i }).closest("div")!;
expect(summary).toHaveTextContent("Subtotal");
expect(summary).toHaveTextContent("Rs. 200");
expect(summary).toHaveTextContent("Total");
  });

  test("blocks checkout if selected item is out of stock", async () => {
    const user = userEvent.setup();

    useCartMock.mockReturnValue({
      cart: {
        items: [
          makeItem({ productId: "p1", qty: 1, priceSnapshot: 100, stock: 0, name: "Out Item" }),
        ],
      },
      count: 1,
      loading: false,
      setQty: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      selectedIds: ["p1"],
      isSelected: () => true,
      toggleSelected: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
    });

    render(<CartPage />);

    await user.click(screen.getByRole("button", { name: /proceed to checkout/i }));

    expect(
      await screen.findByText(/untick\/remove out-of-stock selected items first/i)
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("successful checkout navigates to /user/dashboard/checkout", async () => {
    const user = userEvent.setup();

    useCartMock.mockReturnValue({
      cart: {
        items: [
          makeItem({ productId: "p1", qty: 1, priceSnapshot: 100, stock: 5, name: "OK" }),
        ],
      },
      count: 1,
      loading: false,
      setQty: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      selectedIds: ["p1"],
      isSelected: () => true,
      toggleSelected: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
    });

    render(<CartPage />);

    await user.click(screen.getByRole("button", { name: /proceed to checkout/i }));

    expect(mockPush).toHaveBeenCalledWith("/user/dashboard/checkout");
  });

  test("qty buttons call setQty with correct values", async () => {
    const user = userEvent.setup();

    const setQty = jest.fn(async () => {});
    useCartMock.mockReturnValue({
      cart: { items: [makeItem({ productId: "p1", qty: 2, priceSnapshot: 100, stock: 10, name: "A" })] },
      count: 1,
      loading: false,
      setQty,
      remove: jest.fn(),
      clear: jest.fn(),
      selectedIds: [],
      isSelected: () => false,
      toggleSelected: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
    });

    render(<CartPage />);

    // find "-" and "+" for the row
    const minus = screen.getByRole("button", { name: "-" });
    const plus = screen.getByRole("button", { name: "+" });

    await user.click(plus);
    await waitFor(() => expect(setQty).toHaveBeenCalledWith("p1", 3));

    await user.click(minus);
    await waitFor(() => expect(setQty).toHaveBeenCalledWith("p1", 1));
  });

  test("remove calls remove(id) and clear cart calls clear()", async () => {
    const user = userEvent.setup();

    const remove = jest.fn(async () => {});
    const clear = jest.fn(async () => {});
    useCartMock.mockReturnValue({
      cart: { items: [makeItem({ productId: "p1", qty: 1, stock: 10, name: "A" })] },
      count: 1,
      loading: false,
      setQty: jest.fn(),
      remove,
      clear,
      selectedIds: [],
      isSelected: () => false,
      toggleSelected: jest.fn(),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
    });

    render(<CartPage />);

    await user.click(screen.getByRole("button", { name: /remove/i }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("p1"));

    await user.click(screen.getByRole("button", { name: /clear cart/i }));
    expect(clear).toHaveBeenCalledTimes(1);
  });

  test("selection toolbar buttons call selectAll and clearSelection", async () => {
    const user = userEvent.setup();

    const selectAll = jest.fn();
    const clearSelection = jest.fn();

    useCartMock.mockReturnValue({
      cart: { items: [makeItem({ productId: "p1" })] },
      count: 1,
      loading: false,
      setQty: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      selectedIds: ["p1"], // so clearSelection enabled
      isSelected: () => true,
      toggleSelected: jest.fn(),
      selectAll,
      clearSelection,
    });

    render(<CartPage />);

    await user.click(screen.getByRole("button", { name: /select all/i }));
    expect(selectAll).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });
});