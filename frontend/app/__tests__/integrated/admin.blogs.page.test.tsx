import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminBlogsPage from "@/app/admin/blogs/page";

import {
  adminCreateBlog,
  adminDeleteBlog,
  adminListBlogs,
  adminUpdateBlog,
  adminGetBlogById,
} from "@/lib/api/admin/blog";

jest.mock("@/lib/api/admin/blog", () => ({
  adminCreateBlog: jest.fn(),
  adminDeleteBlog: jest.fn(),
  adminListBlogs: jest.fn(),
  adminUpdateBlog: jest.fn(),
  adminGetBlogById: jest.fn(),
}));

const toastMock = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

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

const adminListBlogsMock = adminListBlogs as jest.Mock;
const adminCreateBlogMock = adminCreateBlog as jest.Mock;
const adminUpdateBlogMock = adminUpdateBlog as jest.Mock;
const adminDeleteBlogMock = adminDeleteBlog as jest.Mock;
const adminGetBlogByIdMock = adminGetBlogById as jest.Mock;

function listResp(rows: any[], meta = { total: rows.length, page: 1, limit: 10 }) {
  // matches your page.tsx normalization logic
  return { data: { data: rows, meta } };
}

function getCreateCardEl() {
  // Card root has data-slot="card" (from your shadcn Card)
  const titleEl = screen.getByText("Create new post");
  const card = titleEl.closest('[data-slot="card"]') as HTMLElement | null;
  if (!card) throw new Error("Create card not found (data-slot='card').");
  return card;
}

function getTableRowByTitle(title: string) {
  // Find the cell text (title) then move to row
  const titleEl = screen.getByText(title);
  const row = titleEl.closest("tr") as HTMLElement | null;
  if (!row) throw new Error(`Row not found for title: ${title}`);
  return row;
}

describe("AdminBlogsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("loads and renders blog list on mount", async () => {
    adminListBlogsMock.mockResolvedValueOnce(
      listResp(
        [
          {
            _id: "b1",
            title: "Tomato Tips",
            slug: "tomato-tips",
            excerpt: "Short excerpt",
            status: "draft",
            updatedAt: "2026-02-01T10:00:00.000Z",
          },
          {
            _id: "b2",
            title: "Fertilizer Guide",
            slug: "fertilizer-guide",
            excerpt: "Another excerpt",
            status: "published",
            updatedAt: "2026-02-02T10:00:00.000Z",
          },
        ],
        { total: 2, page: 1, limit: 10 }
      )
    );

    render(<AdminBlogsPage />);

    // wait until rows appear
    expect(await screen.findByText("Tomato Tips")).toBeInTheDocument();
    expect(screen.getByText("Fertilizer Guide")).toBeInTheDocument();

    // verify API call
    expect(adminListBlogsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        search: undefined,
        status: "all",
      })
    );

    // ✅ avoid "Draft" collision with <option>.
    // Assert badges within each row:
    const row1 = getTableRowByTitle("Tomato Tips");
    expect(within(row1).getByText("Draft")).toBeInTheDocument();

    const row2 = getTableRowByTitle("Fertilizer Guide");
    expect(within(row2).getByText("Published")).toBeInTheDocument();
  });

  test("create post validates required fields", async () => {
    adminListBlogsMock.mockResolvedValueOnce(listResp([]));

    render(<AdminBlogsPage />);
    await screen.findByText("Blogs");

    await userEvent.click(screen.getByRole("button", { name: /create post/i }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(adminCreateBlogMock).not.toHaveBeenCalled();
  });

  test("create post calls API with FormData and refreshes list", async () => {
    adminListBlogsMock.mockResolvedValueOnce(listResp([])); // mount
    adminCreateBlogMock.mockResolvedValueOnce({ success: true });

    // after create -> fetchAll(1, limit)
    adminListBlogsMock.mockResolvedValueOnce(
      listResp([
        {
          _id: "b99",
          title: "New Blog",
          slug: "new-blog",
          excerpt: "Hello",
          status: "draft",
          updatedAt: "2026-02-03T10:00:00.000Z",
        },
      ])
    );

    render(<AdminBlogsPage />);
    await screen.findByText("Blogs");

    const createCard = getCreateCardEl();

    await userEvent.type(
      within(createCard).getByPlaceholderText("e.g. 7 Tips for Better Tomato Farming"),
      "New Blog"
    );

    await userEvent.type(within(createCard).getByPlaceholderText("Short summary (1–2 lines)."), "Hello");
    await userEvent.type(within(createCard).getByPlaceholderText("Write the full blog content here..."), "Full content");

    // status select is the ONLY combobox inside create card at first render
    const statusSelect = within(createCard).getByRole("combobox");
    await userEvent.selectOptions(statusSelect, "published");

    await userEvent.click(within(createCard).getByRole("button", { name: /create post/i }));

    expect(adminCreateBlogMock).toHaveBeenCalledTimes(1);

    const fd = adminCreateBlogMock.mock.calls[0][0] as FormData;

    const out: Record<string, any> = {};
    // @ts-ignore
    for (const [k, v] of fd.entries()) out[k] = v;

    expect(out.title).toBe("New Blog");
    expect(out.excerpt).toBe("Hello");
    expect(out.content).toBe("Full content");
    expect(out.status).toBe("published");

    // refreshed list
    expect(await screen.findByText("New Blog")).toBeInTheDocument();
  });

  test("clicking edit fetches full blog by id and enters edit mode", async () => {
    adminListBlogsMock.mockResolvedValueOnce(
      listResp([
        {
          _id: "b1",
          title: "Tomato Tips",
          slug: "tomato-tips",
          excerpt: "Short excerpt",
          status: "draft",
          updatedAt: "2026-02-01T10:00:00.000Z",
        },
      ])
    );

    // IMPORTANT: your code reads: const full = res?.data?.data;
    adminGetBlogByIdMock.mockResolvedValueOnce({
      data: {
        data: {
          _id: "b1",
          title: "Tomato Tips (full)",
          slug: "tomato-tips",
          excerpt: "Short excerpt",
          content: "Full content from detail api",
          status: "draft",
        },
      },
    });

    render(<AdminBlogsPage />);

    expect(await screen.findByText("Tomato Tips")).toBeInTheDocument();

    const row = getTableRowByTitle("Tomato Tips");
    await userEvent.click(within(row).getByRole("button", { name: /edit/i }));

    expect(adminGetBlogByIdMock).toHaveBeenCalledWith("b1");

    // edit mode now shows input populated with fetched title & content textarea populated
    expect(await screen.findByDisplayValue("Tomato Tips (full)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Full content from detail api")).toBeInTheDocument();
  });

  test("saving edit calls update API and refreshes list", async () => {
    adminListBlogsMock.mockResolvedValueOnce(
      listResp([
        { _id: "b1", title: "Tomato Tips", slug: "tomato-tips", excerpt: "X", status: "draft", updatedAt: "" },
      ])
    );

    adminGetBlogByIdMock.mockResolvedValueOnce({
      data: {
        data: {
          _id: "b1",
          title: "Tomato Tips",
          slug: "tomato-tips",
          excerpt: "X",
          content: "Old content",
          status: "draft",
        },
      },
    });

    adminUpdateBlogMock.mockResolvedValueOnce({ success: true });

    // after save -> fetchAll(page,limit)
    adminListBlogsMock.mockResolvedValueOnce(
      listResp([
        { _id: "b1", title: "Tomato Tips Updated", slug: "tomato-tips", excerpt: "X", status: "draft", updatedAt: "" },
      ])
    );

    render(<AdminBlogsPage />);
    expect(await screen.findByText("Tomato Tips")).toBeInTheDocument();

    const row = getTableRowByTitle("Tomato Tips");
    await userEvent.click(within(row).getByRole("button", { name: /edit/i }));

    expect(await screen.findByDisplayValue("Old content")).toBeInTheDocument();

    const titleInput = screen.getByDisplayValue("Tomato Tips") as HTMLInputElement;
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Tomato Tips Updated");

    // Save button is inside that same row in edit mode
    const editRow = titleInput.closest("tr")!;
    await userEvent.click(within(editRow).getByRole("button", { name: /^save$/i }));

    expect(adminUpdateBlogMock).toHaveBeenCalledTimes(1);
    const [id, fd] = adminUpdateBlogMock.mock.calls[0];

    expect(id).toBe("b1");
    expect(fd).toBeInstanceOf(FormData);

    const out: Record<string, any> = {};
    // @ts-ignore
    for (const [k, v] of (fd as FormData).entries()) out[k] = v;
    expect(out.title).toBe("Tomato Tips Updated");

    expect(await screen.findByText("Tomato Tips Updated")).toBeInTheDocument();
  });

  test("delete opens confirm dialog and calls delete API on confirm", async () => {
    adminListBlogsMock.mockResolvedValueOnce(
      listResp([
        { _id: "b1", title: "Tomato Tips", slug: "tomato-tips", excerpt: "X", status: "draft", updatedAt: "" },
      ])
    );

    adminDeleteBlogMock.mockResolvedValueOnce({ success: true });
    adminListBlogsMock.mockResolvedValueOnce(listResp([])); // after delete refresh

    render(<AdminBlogsPage />);
    expect(await screen.findByText("Tomato Tips")).toBeInTheDocument();

    const row = getTableRowByTitle("Tomato Tips");
    await userEvent.click(within(row).getByRole("button", { name: /^delete$/i }));

    const dlg = screen.getByTestId("confirm-dialog");
    expect(dlg).toBeInTheDocument();

    // ✅ avoid global /tomato tips/i collisions: assert inside dialog only
    expect(within(dlg).getByText(/tomato tips/i)).toBeInTheDocument();

    // confirm delete (inside dialog)
    await userEvent.click(within(dlg).getByRole("button", { name: /delete/i }));

    expect(adminDeleteBlogMock).toHaveBeenCalledWith("b1");
    expect(await screen.findByText("No blog posts found.")).toBeInTheDocument();
  });
});