// app/__tests__/integrated/shop.page.test.tsx
import React from "react";
import { render, screen, within, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShopPage from "@/app/user/dashboard/shop/page";

import { listPublicProducts } from "@/lib/api/public/products";
import { listPublicCategories } from "@/lib/api/public/category";
import { getPublicSettings } from "@/lib/api/settings";

// ---------------------
// router mocks
// ---------------------
const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/user/dashboard/shop",
}));

// ---------------------
// UI mocks
// ---------------------
jest.mock("@/app/user/component/header", () => ({
  Header: () => <div data-testid="header" />,
}));
jest.mock("@/app/user/component/footer", () => ({
  Footer: () => <div data-testid="footer" />,
}));
jest.mock("@/app/auth/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));
jest.mock("@/app/auth/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock("@/app/auth/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    description,
    confirmText,
    cancelText,
    onConfirm,
  }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <div>{title}</div>
        <div>{description}</div>
        <button onClick={onConfirm}>{confirmText}</button>
        <button>{cancelText}</button>
      </div>
    ) : null,
}));

// ---------------------
// context mocks
// ---------------------
const addMock = jest.fn();
const refreshMock = jest.fn();
const selectOnlyMock = jest.fn();

jest.mock("@/lib/contexts/cart-context", () => ({
  useCart: () => ({
    add: addMock,
    refresh: refreshMock,
    selectOnly: selectOnlyMock,
  }),
}));

const useAuthMock = jest.fn();
jest.mock("@/lib/contexts/auth-contexts", () => ({
  useAuth: () => useAuthMock(),
}));

// ---------------------
// API mocks
// ---------------------
jest.mock("@/lib/api/public/products", () => ({
  listPublicProducts: jest.fn(),
}));
jest.mock("@/lib/api/public/category", () => ({
  listPublicCategories: jest.fn(),
}));
jest.mock("@/lib/api/settings", () => ({
  getPublicSettings: jest.fn(),
}));

const listPublicProductsMock = listPublicProducts as jest.Mock;
const listPublicCategoriesMock = listPublicCategories as jest.Mock;
const getPublicSettingsMock = getPublicSettings as jest.Mock;

function makeProduct(overrides: any = {}) {
  return {
    _id: overrides._id ?? "p1",
    name: overrides.name ?? "Tomato Seeds",
    slug: overrides.slug ?? "tomato",
    price: overrides.price ?? 100,
    discountPrice: overrides.discountPrice ?? null,
    stock: overrides.stock ?? 10,
    images: overrides.images ?? ["img1.jpg"],
    category: overrides.category ?? { name: "Seeds" },
    ...overrides,
  };
}

async function flushDebounce(ms = 450) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe("ShopPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pushMock.mockClear();

    jest.useFakeTimers();

    useAuthMock.mockReturnValue({ user: { _id: "u1", name: "Krish" } });

    getPublicSettingsMock.mockResolvedValue({ data: { lowStockThreshold: 5 } });

    listPublicCategoriesMock.mockResolvedValue({
      data: [
        { _id: "c1", name: "Seeds", slug: "seeds" },
        { _id: "c2", name: "Fertilizers", slug: "fertilizers" },
      ],
    });

    listPublicProductsMock.mockResolvedValue({
      data: [
        makeProduct({ _id: "p1", name: "Tomato Seeds", category: { name: "Seeds" } }),
        makeProduct({ _id: "p2", name: "Urea", slug: "urea", category: { name: "Seeds" } }),
      ],
    });

    addMock.mockResolvedValue(undefined);
    refreshMock.mockResolvedValue(undefined);
    selectOnlyMock.mockImplementation(() => {});
  });

  afterEach(() => {
    // ✅ do NOT runOnlyPendingTimers() (Next Link intersection timers cause act warning)
    cleanup();
    jest.useRealTimers();
  });

  test("renders header/footer and loads categories + products", async () => {
    render(<ShopPage />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText(/^shop$/i)).toBeInTheDocument();

    // products appear
    expect(await screen.findByText("Tomato Seeds")).toBeInTheDocument();
    expect(screen.getByText("Urea")).toBeInTheDocument();

    // ✅ find the Categories card safely:
    // - pick the card that contains a heading exactly "Categories"
    const cards = screen.getAllByTestId("card");
    const categoriesCard = cards.find((c) => {
      const w = within(c);
      return w.queryByText(/^categories$/i) != null;
    });
    expect(categoriesCard).toBeTruthy();

    const catScope = within(categoriesCard!);

    // verify categories list buttons exist
    expect(catScope.getByRole("button", { name: "All Categories" })).toBeInTheDocument();
    expect(catScope.getByRole("button", { name: "Seeds" })).toBeInTheDocument();
    expect(catScope.getByRole("button", { name: "Fertilizers" })).toBeInTheDocument();

    expect(screen.getByTestId("footer")).toBeInTheDocument();

    // initial load called
    expect(listPublicProductsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 12,
        sort: "newest",
      })
    );
  });

  test("clicking a category triggers API with categorySlug", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<ShopPage />);
    await screen.findByText("Tomato Seeds");

    await user.click(screen.getByRole("button", { name: "Fertilizers" }));

    // ✅ debounced fetch
    await flushDebounce(450);

    expect(listPublicProductsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        categorySlug: "fertilizers",
        page: 1,
        limit: 12,
      })
    );
  });
});