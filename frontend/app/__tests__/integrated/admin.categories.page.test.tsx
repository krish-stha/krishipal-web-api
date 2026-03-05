import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminCategoriesPage from "@/app/admin/categories/page";

import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from "@/lib/api/admin/category";

jest.mock("@/lib/api/admin/category", () => ({
  adminCreateCategory: jest.fn(),
  adminDeleteCategory: jest.fn(),
  adminListCategories: jest.fn(),
  adminUpdateCategory: jest.fn(),
}));

const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

// Make confirm dialog testable and deterministic
jest.mock("@/app/auth/components/ui/confirm-dialog", () => ({
  ConfirmDialog: (props: any) => {
    if (!props.open) return null;
    return (
      <div data-testid="confirm-dialog">
        <div>{props.title}</div>
        <div>{props.description}</div>
        <button onClick={() => props.onConfirm?.()}>{props.confirmText || "Confirm"}</button>
        <button onClick={() => props.onOpenChange?.(false)}>{props.cancelText || "Cancel"}</button>
      </div>
    );
  },
}));

const listMock = adminListCategories as jest.Mock;
const createMock = adminCreateCategory as jest.Mock;
const updateMock = adminUpdateCategory as jest.Mock;
const deleteMock = adminDeleteCategory as jest.Mock;

function listResp(rows: any[]) {
  // your normalizeList supports: {data:{data:[...]}} or {data:[...]} or [...]
  return { data: { data: rows } };
}

function getRowByName(name: string) {
  const cell = screen.getByText(name);
  const row = cell.closest("tr") as HTMLElement | null;
  if (!row) throw new Error(`Row not found for category: ${name}`);
  return row;
}

describe("AdminCategoriesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads categories on mount and renders table rows", async () => {
    listMock.mockResolvedValueOnce(
      listResp([
        { _id: "c1", name: "Seeds", slug: "seeds", isActive: true },
        { _id: "c2", name: "Fertilizers", slug: "fertilizers", isActive: false },
      ])
    );

    render(<AdminCategoriesPage />);

    // wait for data to show
    expect(await screen.findByText("Seeds")).toBeInTheDocument();
    expect(screen.getByText("Fertilizers")).toBeInTheDocument();

    // called on mount
    expect(listMock).toHaveBeenCalledTimes(1);

    // status text is duplicated in UI sometimes -> scope per row
    const seedsRow = getRowByName("Seeds");
    expect(within(seedsRow).getByText("Active")).toBeInTheDocument();

    const fertRow = getRowByName("Fertilizers");
    expect(within(fertRow).getByText("Inactive")).toBeInTheDocument();
  });

  test("create category calls API, refreshes list, and shows success banner", async () => {
    listMock.mockResolvedValueOnce(listResp([])); // mount
    createMock.mockResolvedValueOnce({ success: true });

    // after create -> fetchAll
    listMock.mockResolvedValueOnce(
      listResp([{ _id: "c9", name: "Tools", slug: "tools", isActive: true }])
    );

    render(<AdminCategoriesPage />);
    await screen.findByText("Categories");

    const input = screen.getByPlaceholderText("New category name");
    await userEvent.type(input, "Tools");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(createMock).toHaveBeenCalledWith({ name: "Tools" });

    // list refresh + new row appears
    expect(await screen.findByText("Tools")).toBeInTheDocument();

    // success banner message
    expect(screen.getByText(/Category “Tools” added\./)).toBeInTheDocument();
  });

  test("edit category calls update API and refreshes list", async () => {
    listMock.mockResolvedValueOnce(
      listResp([{ _id: "c1", name: "Seeds", slug: "seeds", isActive: true }])
    );

    updateMock.mockResolvedValueOnce({ success: true });

    // after save -> fetchAll
    listMock.mockResolvedValueOnce(
      listResp([{ _id: "c1", name: "Seeds Updated", slug: "seeds", isActive: false }])
    );

    render(<AdminCategoriesPage />);

    expect(await screen.findByText("Seeds")).toBeInTheDocument();

    const row = getRowByName("Seeds");
    await userEvent.click(within(row).getByRole("button", { name: "Edit" }));

    // edit mode: textbox (name) + checkbox
    const nameInput = within(row).getByRole("textbox") as HTMLInputElement;
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Seeds Updated");

    // checkbox is checked initially (active true). Toggle to false.
    const checkbox = within(row).getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    await userEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);

    await userEvent.click(within(row).getByRole("button", { name: "Save" }));

    expect(updateMock).toHaveBeenCalledWith("c1", { name: "Seeds Updated", isActive: false });

    // refreshed row
    expect(await screen.findByText("Seeds Updated")).toBeInTheDocument();

    // inactive text in view mode
    const updatedRow = getRowByName("Seeds Updated");
    expect(within(updatedRow).getByText("Inactive")).toBeInTheDocument();
  });

  test("delete opens confirm dialog and calls delete API on confirm", async () => {
    listMock.mockResolvedValueOnce(
      listResp([{ _id: "c1", name: "Seeds", slug: "seeds", isActive: true }])
    );

    deleteMock.mockResolvedValueOnce({ success: true });

    // after delete -> fetchAll -> empty
    listMock.mockResolvedValueOnce(listResp([]));

    render(<AdminCategoriesPage />);
    expect(await screen.findByText("Seeds")).toBeInTheDocument();

    const row = getRowByName("Seeds");
    await userEvent.click(within(row).getByRole("button", { name: "Delete" }));

    const dlg = screen.getByTestId("confirm-dialog");
    expect(dlg).toBeInTheDocument();
    expect(within(dlg).getByText(/Delete category\?/i)).toBeInTheDocument();
    expect(within(dlg).getByText(/Seeds/i)).toBeInTheDocument();

    // confirm
    await userEvent.click(within(dlg).getByRole("button", { name: "Delete" }));

    expect(deleteMock).toHaveBeenCalledWith("c1");
    expect(await screen.findByText("No categories yet.")).toBeInTheDocument();
  });

  test("dismiss success banner hides it", async () => {
    listMock.mockResolvedValueOnce(listResp([])); // mount
    createMock.mockResolvedValueOnce({ success: true });
    listMock.mockResolvedValueOnce(listResp([{ _id: "c9", name: "Tools", slug: "tools", isActive: true }]));

    render(<AdminCategoriesPage />);
    await screen.findByText("Categories");

    await userEvent.type(screen.getByPlaceholderText("New category name"), "Tools");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText(/Category “Tools” added\./)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/Category “Tools” added\./)).not.toBeInTheDocument();
  });
});