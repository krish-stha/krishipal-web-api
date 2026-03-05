import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminSettingsPage from "@/app/admin/settings/page";

import {
  adminGetSettings,
  adminUpdateSettings,
  adminUploadLogo,
} from "@/lib/api/admin/settings";

jest.mock("@/lib/api/admin/settings", () => ({
  adminGetSettings: jest.fn(),
  adminUpdateSettings: jest.fn(),
  adminUploadLogo: jest.fn(),
}));

const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

const getMock = adminGetSettings as jest.Mock;
const updateMock = adminUpdateSettings as jest.Mock;
const uploadMock = adminUploadLogo as jest.Mock;

function settingsResp(data: any) {
  return { data: { data } };
}

// Helpers to avoid "closest('div')" scoping bugs
function getCardByTitle(title: string) {
  const t = screen.getByText(title);
  // Title is usually inside the Card container; go up until we hit a "Card-ish" wrapper.
  // We try a few known wrappers and finally fall back to parent chain.
  return (
    t.closest('[data-slot="card"]') ||
    t.closest(".rounded-3xl") ||
    t.closest(".bg-card") ||
    t.parentElement?.parentElement ||
    t.parentElement ||
    t
  ) as HTMLElement;
}

function getStoreProfileInputs() {
  const card = getCardByTitle("Store Profile");
  const textboxes = within(card).getAllByRole("textbox");
  // Order in UI:
  // [0] Store Name, [1] Store Email, [2] Store Phone, [3] Store Address textarea
  return {
    card,
    storeName: textboxes[0],
    storeEmail: textboxes[1],
    storePhone: textboxes[2],
  };
}

function getEnabledPaymentsBox() {
  const el = screen.getByText(/Enabled payments/i);
  return (
    el.closest(".rounded-2xl") || el.parentElement || el
  ) as HTMLElement;
}

describe("AdminSettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:5000";
  });

  test("loads settings on mount and renders initial values + preview", async () => {
    getMock.mockResolvedValueOnce(
      settingsResp({
        storeName: "KrishiPal",
        storeAddress: "Kathmandu",
        storeEmail: "hello@krishipal.com",
        storePhone: "+9779812345678",
        storeLogo: "logo.png",
        shippingFeeDefault: 120,
        freeShippingThreshold: 1000,
        lowStockThreshold: 6,
        payments: { COD: true, KHALTI: false, ESEWA: true },
      })
    );

    render(<AdminSettingsPage />);

    // wait for async fetch to populate inputs
    expect(await screen.findByDisplayValue("KrishiPal")).toBeInTheDocument();
    expect(screen.getByDisplayValue("hello@krishipal.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+9779812345678")).toBeInTheDocument();

    // preview values show (avoid ambiguous "6" by scoping to Preview card)
    const previewCard = getCardByTitle("Preview");
    expect(within(previewCard).getByText("Rs. 120")).toBeInTheDocument();
    expect(within(previewCard).getByText("Rs. 1000")).toBeInTheDocument();
    // "6" could appear elsewhere, so scope it
    expect(within(previewCard).getByText("6")).toBeInTheDocument();

    // enabled payment badges in preview (scope correctly)
    const enabledPaymentsBox = getEnabledPaymentsBox();
    expect(within(enabledPaymentsBox).getByText("COD")).toBeInTheDocument();
    expect(within(enabledPaymentsBox).getByText("ESEWA")).toBeInTheDocument();
    // KHALTI disabled -> badge should NOT exist in Enabled payments box
    expect(within(enabledPaymentsBox).queryByText("KHALTI")).toBeNull();

    // toast called for refresh success
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Refreshed" })
    );
  });

  test("shows error banner when load fails", async () => {
    getMock.mockRejectedValueOnce(new Error("load fail"));

    render(<AdminSettingsPage />);

    expect(
      await screen.findByText(/load fail|Failed to load settings/i)
    ).toBeInTheDocument();

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Load failed" })
    );
  });

  test("save settings calls API with normalized payload and shows success message", async () => {
    getMock.mockResolvedValueOnce(
      settingsResp({
        storeName: "KrishiPal",
        storeAddress: "",
        storeEmail: "",
        storePhone: "",
        storeLogo: "",
        shippingFeeDefault: 0,
        freeShippingThreshold: null,
        lowStockThreshold: 5,
        payments: { COD: true, KHALTI: true, ESEWA: true },
      })
    );

    updateMock.mockResolvedValueOnce(
      settingsResp({
        storeName: "KrishiPal Updated",
        storeAddress: "Somewhere",
        storeEmail: "admin@krishipal.com",
        storePhone: "+9779800000000",
        shippingFeeDefault: 150,
        freeShippingThreshold: null,
        lowStockThreshold: 4,
        payments: { COD: true, KHALTI: false, ESEWA: true },
      })
    );

    render(<AdminSettingsPage />);

    // wait initial
    await screen.findByDisplayValue("KrishiPal");

    const user = userEvent.setup();

    // Update a few fields (avoid getByLabelText — labels aren't associated)
    const { storeName, storeEmail, storePhone } = getStoreProfileInputs();

    // Shipping fee (number input) - scope to Shipping card
    const shippingCard = getCardByTitle("Shipping");
    const shippingFeeInput = shippingCard.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;

    await user.clear(storeName);
    await user.type(storeName, "KrishiPal Updated");

    await user.clear(storeEmail);
    await user.type(storeEmail, "admin@krishipal.com");

    await user.clear(storePhone);
    await user.type(storePhone, "+9779800000000");

    await user.clear(shippingFeeInput);
    await user.type(shippingFeeInput, "150");

    await user.click(
      screen.getByRole("button", { name: /save settings/i })
    );

    // payload should be normalized (numbers + booleans)
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledTimes(1);
    });

    const payload = updateMock.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        storeName: "KrishiPal Updated",
        storeEmail: "admin@krishipal.com",
        storePhone: "+9779800000000",
        shippingFeeDefault: 150,
        freeShippingThreshold: null,
        lowStockThreshold: expect.any(Number),
        payments: expect.any(Object),
      })
    );

    // success banner
    expect(await screen.findByText("Settings saved ✅")).toBeInTheDocument();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Saved" })
    );
  });

  test("save blocks when all payment methods disabled (validation)", async () => {
    getMock.mockResolvedValueOnce(
      settingsResp({
        storeName: "KrishiPal",
        storeAddress: "",
        storeEmail: "",
        storePhone: "",
        storeLogo: "",
        shippingFeeDefault: 0,
        freeShippingThreshold: null,
        lowStockThreshold: 5,
        payments: { COD: true, KHALTI: true, ESEWA: true },
      })
    );

    render(<AdminSettingsPage />);
    await screen.findByDisplayValue("KrishiPal");

    const user = userEvent.setup();

    // disable all three checkboxes in Payment Methods section
    const paymentsCard = getCardByTitle("Payment Methods");
    const checkboxes = paymentsCard.querySelectorAll(
      'input[type="checkbox"]'
    ) as NodeListOf<HTMLInputElement>;

    expect(checkboxes.length).toBe(3);

    for (const cb of Array.from(checkboxes)) {
      if (cb.checked) await user.click(cb);
    }

    await user.click(
      screen.getByRole("button", { name: /save settings/i })
    );

    expect(updateMock).not.toHaveBeenCalled();

    expect(
      await screen.findByText(/At least one payment method must be enabled/i)
    ).toBeInTheDocument();

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Validation error" })
    );
  });

  test("refresh button refetches settings", async () => {
    getMock
      .mockResolvedValueOnce(
        settingsResp({
          storeName: "A",
          storeEmail: "",
          storePhone: "",
          payments: { COD: true, KHALTI: true, ESEWA: true },
        })
      )
      .mockResolvedValueOnce(
        settingsResp({
          storeName: "B",
          storeEmail: "",
          storePhone: "",
          payments: { COD: true, KHALTI: true, ESEWA: true },
        })
      );

    render(<AdminSettingsPage />);

    expect(await screen.findByDisplayValue("A")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /refresh/i }));

    expect(await screen.findByDisplayValue("B")).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  test("upload logo failure shows error banner", async () => {
    getMock.mockResolvedValueOnce(
      settingsResp({
        storeName: "KrishiPal",
        storeEmail: "",
        storePhone: "",
        storeLogo: "",
        payments: { COD: true, KHALTI: true, ESEWA: true },
      })
    );

    uploadMock.mockRejectedValueOnce(new Error("upload fail"));

    render(<AdminSettingsPage />);
    await screen.findByDisplayValue("KrishiPal");

    const user = userEvent.setup();

    const storeProfileCard = getCardByTitle("Store Profile");
    const fileInput = storeProfileCard.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const file = new File(["hello"], "logo.png", { type: "image/png" });
    await user.upload(fileInput, file);

    expect(
      await screen.findByText(/upload fail|Logo upload failed/i)
    ).toBeInTheDocument();

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Upload failed" })
    );
  });
});