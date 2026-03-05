import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUsersPage from "@/app/admin/users/page";

import { adminListUsers, adminSoftDeleteUser } from "@/lib/api/admin/user";

jest.mock("@/lib/api/admin/user", () => ({
  adminListUsers: jest.fn(),
  adminSoftDeleteUser: jest.fn(),
}));

const listMock = adminListUsers as jest.Mock;
const deleteMock = adminSoftDeleteUser as jest.Mock;

// next/link mock
jest.mock("next/link", () => {
  return ({ href, children }: any) => <a href={href}>{children}</a>;
});


// toast mock
const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

// ConfirmDialog mock
jest.mock("@/app/auth/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    description,
    confirmText,
    cancelText,
    onConfirm,
    onOpenChange,
    loading,
  }: any) => {
    if (!open) return null;
    return (
      <div role="dialog" aria-label="confirm-dialog">
        <div>{title}</div>
        <div>{description}</div>
        <button onClick={() => onOpenChange(false)}>{cancelText}</button>
        <button onClick={onConfirm} disabled={!!loading}>
          {confirmText}
        </button>
      </div>
    );
  },
}));

function respUsers(users: any[], meta?: any) {
  return { data: users, meta };
}

async function waitPageLoaded() {
  // loading banner disappears when data set
  await waitFor(() => {
    expect(screen.queryByText(/Loading users\.\.\./i)).not.toBeInTheDocument();
  });
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:5000";
  });

  test("loads users on mount and renders stats + table rows", async () => {
    listMock.mockResolvedValueOnce(
      respUsers(
        [
          {
            _id: "u1",
            fullName: "Admin One",
            email: "admin@x.com",
            role: "admin",
            createdAt: "2026-02-20T10:00:00.000Z",
            profile_picture: null,
          },
          {
            _id: "u2",
            fullName: "User One",
            email: "user@x.com",
            role: "user",
            createdAt: "2026-02-21T10:00:00.000Z",
            profile_picture: "avatar.png",
          },
        ],
        { total: 2, page: 1, limit: 10, totalPages: 1 }
      )
    );

    render(<AdminUsersPage />);

    // ✅ wait for page to finish loading
    await waitPageLoaded();

    // ✅ ensure rows are actually rendered (strong signal fetch finished)
    expect(screen.getByText("Admin One")).toBeInTheDocument();
    expect(screen.getByText("User One")).toBeInTheDocument();

    // ✅ ensure fetch called
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith({ page: 1, limit: 10 });

    // ✅ assert stats in a scoped way (avoid getByText("2") generic)
    const totalBadge = screen.getByText(/Total:/i).closest("div")!;
    expect(within(totalBadge).getByText("2")).toBeInTheDocument();

    const adminsBadge = screen.getByText(/Admins \(this page\):/i).closest("div")!;
    expect(within(adminsBadge).getByText("1")).toBeInTheDocument();

    const usersBadge = screen.getByText(/Users \(this page\):/i).closest("div")!;
    expect(within(usersBadge).getByText("1")).toBeInTheDocument();

    // action links exist
    expect(screen.getAllByText("View").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Edit").length).toBeGreaterThanOrEqual(1);
  });

  test("shows error banner when API fails", async () => {
    listMock.mockRejectedValueOnce(new Error("load fail"));

    render(<AdminUsersPage />);

    // loading disappears and error appears
    await waitFor(() => {
      expect(
        screen.getByText(/load fail|Unable to load users/i)
      ).toBeInTheDocument();
    });
  });

  test("filters by search query (current page) and shows 'No users match' when none", async () => {
    listMock.mockResolvedValueOnce(
      respUsers(
        [
          { _id: "u1", fullName: "Ram", email: "ram@test.com", role: "user" },
          { _id: "u2", fullName: "Sita", email: "sita@test.com", role: "admin" },
        ],
        { total: 2, page: 1, limit: 10, totalPages: 1 }
      )
    );

    render(<AdminUsersPage />);
    await waitPageLoaded();

    expect(screen.getByText("Ram")).toBeInTheDocument();

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/Search \(current page\)/i);

    await user.type(searchInput, "no-match-here");

    expect(screen.queryByText("Ram")).not.toBeInTheDocument();
    expect(screen.queryByText("Sita")).not.toBeInTheDocument();
    expect(screen.getByText(/No users match your filters/i)).toBeInTheDocument();
  });

 

  test("delete flow: click row delete -> confirm -> API called -> toast shown -> refetch", async () => {
    listMock.mockResolvedValueOnce(
      respUsers(
        [
          { _id: "u1", fullName: "Ram", email: "ram@test.com", role: "user" },
          { _id: "u2", fullName: "Sita", email: "sita@test.com", role: "admin" },
        ],
        { total: 2, page: 1, limit: 10, totalPages: 1 }
      )
    );

    listMock.mockResolvedValueOnce(
      respUsers(
        [{ _id: "u2", fullName: "Sita", email: "sita@test.com", role: "admin" }],
        { total: 1, page: 1, limit: 10, totalPages: 1 }
      )
    );

    deleteMock.mockResolvedValueOnce({ ok: true });

    render(<AdminUsersPage />);
    await waitPageLoaded();

    const user = userEvent.setup();
    const ramRow = screen.getByText("Ram").closest("tr")!;
    await user.click(within(ramRow).getByRole("button", { name: /delete/i }));

    const dialog = screen.getByRole("dialog", { name: /confirm-dialog/i });
    await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledTimes(1));
    expect(deleteMock).toHaveBeenCalledWith("u1");

    // refetch happened
    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Deleted" })
    );
  });

  test("delete failure shows destructive toast", async () => {
    listMock.mockResolvedValueOnce(
      respUsers(
        [{ _id: "u1", fullName: "Ram", email: "ram@test.com", role: "user" }],
        { total: 1, page: 1, limit: 10, totalPages: 1 }
      )
    );

    deleteMock.mockRejectedValueOnce(new Error("delete fail"));

    render(<AdminUsersPage />);
    await waitPageLoaded();

    const user = userEvent.setup();
    const ramRow = screen.getByText("Ram").closest("tr")!;
    await user.click(within(ramRow).getByRole("button", { name: /delete/i }));

    const dialog = screen.getByRole("dialog", { name: /confirm-dialog/i });
    await user.click(within(dialog).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledTimes(1));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Delete failed",
        variant: "destructive",
      })
    );
  });

  test("changing pageSize triggers new backend fetch with that limit", async () => {
    listMock.mockResolvedValue(
      respUsers([], { total: 0, page: 1, limit: 10, totalPages: 1 })
    );

    render(<AdminUsersPage />);

    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(1));
    await waitPageLoaded();

    const user = userEvent.setup();

    // the "Rows" select is the one with options 10/20/50
    const selects = screen.getAllByRole("combobox");
    const rowsSelect =
      selects.find((s) => within(s).queryByText("50")) || selects[selects.length - 1];

    await user.selectOptions(rowsSelect as HTMLSelectElement, "20");

    await waitFor(() => expect(listMock).toHaveBeenCalledTimes(2));
    expect(listMock).toHaveBeenLastCalledWith({ page: 1, limit: 20 });
  });
});