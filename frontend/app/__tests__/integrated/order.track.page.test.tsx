// app/__tests__/integrated/order.track.page.test.tsx
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrackOrderPage from "@/app/user/dashboard/orders/[id]/page";

import { getMyOrderById } from "@/lib/api/order";
import { getPublicSettings } from "@/lib/api/settings";
import { getMyRefunds, requestRefund } from "@/lib/api/refund";
import { initiateKhaltiPayment } from "@/lib/api/payment";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: jest.fn(),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const { useParams } = require("next/navigation");

jest.mock("@/app/auth/components/ui/card", () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));
jest.mock("@/app/auth/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

// Dialog used in your TrackOrderPage
jest.mock("@/app/auth/components/ui/alert-dialog", () => ({
  NoteDialog: ({ open }: any) => (open ? <div data-testid="note-dialog" /> : null),
}));

jest.mock("@/lib/api/order", () => ({
  getMyOrderById: jest.fn(),
  cancelMyOrder: jest.fn(),
}));
jest.mock("@/lib/api/settings", () => ({
  getPublicSettings: jest.fn(),
}));
jest.mock("@/lib/api/refund", () => ({
  getMyRefunds: jest.fn(),
  requestRefund: jest.fn(),
}));
jest.mock("@/lib/api/payment", () => ({
  initiateKhaltiPayment: jest.fn(),
}));

const getMyOrderByIdMock = getMyOrderById as jest.Mock;
const getPublicSettingsMock = getPublicSettings as jest.Mock;
const getMyRefundsMock = getMyRefunds as jest.Mock;
const requestRefundMock = requestRefund as jest.Mock;
const initiateKhaltiPaymentMock = initiateKhaltiPayment as jest.Mock;

describe("TrackOrderPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pushMock.mockClear();
  });

  test("renders order items and summary (no ambiguous Rs.200)", async () => {
    useParams.mockReturnValue({ id: "aaaaaaaaaaaaaaaaaaaaaaaa" }); // 24 chars objectId

    getMyOrderByIdMock.mockResolvedValueOnce({
      data: {
        _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
        status: "confirmed",
        paymentStatus: "unpaid",
        paymentGateway: "COD",
        subtotal: 200,
        shippingFee: 0,
        total: 200,
        address: "Jhapa",
        items: [
          {
            name: "Tomato Seeds",
            slug: "tomato",
            sku: "TS1",
            priceSnapshot: 100,
            qty: 2,
          },
        ],
      },
    });

    getMyRefundsMock.mockResolvedValueOnce({ data: [] });

    getPublicSettingsMock.mockResolvedValueOnce({
      data: { payments: { COD: true, KHALTI: true, ESEWA: true } },
    });

    render(<TrackOrderPage />);

    expect(await screen.findByText(/track order/i)).toBeInTheDocument();
    expect(await screen.findByText("Tomato Seeds")).toBeInTheDocument();
    expect(screen.getByText("TS1")).toBeInTheDocument();

    // ✅ scope to the item row for Rs. 200 (line total)
    const row = screen.getByText("Tomato Seeds").closest("tr")!;
    expect(within(row).getByText(/rs\.\s*200/i)).toBeInTheDocument();

    // ✅ summary
    expect(screen.getByText(/delivery address/i)).toBeInTheDocument();
    expect(screen.getByText("Jhapa")).toBeInTheDocument();

    // subtotal + total also show Rs.200 (multiple is expected)
    expect(screen.getAllByText(/rs\.\s*200/i).length).toBeGreaterThanOrEqual(2);
  });

  test("shows error for invalid order id in URL", async () => {
    useParams.mockReturnValue({ id: "bad-id" });

    render(<TrackOrderPage />);

    // ✅ exact string from your component
    expect(await screen.findByText(/invalid order id in url/i)).toBeInTheDocument();
    expect(getMyOrderByIdMock).not.toHaveBeenCalled();
  });

 
});