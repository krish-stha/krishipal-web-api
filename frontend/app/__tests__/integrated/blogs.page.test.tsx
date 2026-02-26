import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ✅ CHANGE THIS IMPORT PATH to your actual blogs page path
import BlogsPage from "@/app/blogs/page";

const publicListBlogsMock = jest.fn();
jest.mock("@/lib/api/public/blog", () => ({
  publicListBlogs: (args: any) => publicListBlogsMock(args),
}));

jest.mock("@/app/user/component/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));
jest.mock("@/app/user/component/footer", () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

// next/link -> anchor
jest.mock("next/link", () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe("BlogsPage", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_BACKEND_URL: "https://api.example.com" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("initial load calls publicListBlogs with page=1, limit=9 and renders empty state", async () => {
    publicListBlogsMock.mockResolvedValueOnce({ data: { data: [], meta: { total: 0, page: 1, limit: 9 } } });

    render(<BlogsPage />);

    // called on mount
    await waitFor(() => {
      expect(publicListBlogsMock).toHaveBeenCalledWith({ page: 1, limit: 9, search: undefined });
    });

    expect(await screen.findByText(/no blog posts yet/i)).toBeInTheDocument();
  });

  test("renders blog cards and links", async () => {
    publicListBlogsMock.mockResolvedValueOnce({
      data: {
        data: [
          {
            _id: "1",
            title: "How to grow tomatoes",
            slug: "grow-tomatoes",
            excerpt: "Tomatoes guide",
            coverImage: "t.png",
            createdAt: "2026-02-01T00:00:00.000Z",
          },
          {
            _id: "2",
            title: "Soil testing basics",
            slug: "soil-testing",
            excerpt: "Soil guide",
            coverImage: null,
          },
        ],
        meta: { total: 2, page: 1, limit: 9 },
      },
    });

    render(<BlogsPage />);

    expect(await screen.findByText(/how to grow tomatoes/i)).toBeInTheDocument();
    expect(screen.getByText(/soil testing basics/i)).toBeInTheDocument();

    // Link hrefs
    const link1 = screen.getByRole("link", { name: /how to grow tomatoes/i });
    expect(link1).toHaveAttribute("href", "/blogs/grow-tomatoes");

    const link2 = screen.getByRole("link", { name: /soil testing basics/i });
    expect(link2).toHaveAttribute("href", "/blogs/soil-testing");

    // Cover image src for first blog
    const img = screen.getByAltText("How to grow tomatoes") as HTMLImageElement;
    expect(img.src).toBe("https://api.example.com/public/uploads/blogs/t.png");
  });

  test("search triggers fetch with search param", async () => {
    // mount call
    publicListBlogsMock.mockResolvedValueOnce({ data: { data: [], meta: { total: 0, page: 1, limit: 9 } } });
    // search call
    publicListBlogsMock.mockResolvedValueOnce({ data: { data: [], meta: { total: 0, page: 1, limit: 9 } } });

    const user = userEvent.setup();
    render(<BlogsPage />);

    await waitFor(() => expect(publicListBlogsMock).toHaveBeenCalledTimes(1));

    await user.type(screen.getByPlaceholderText(/search articles/i), "tomato");
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(publicListBlogsMock).toHaveBeenLastCalledWith({ page: 1, limit: 9, search: "tomato" });
    });
  });

  test("next/prev pagination calls correct pages", async () => {
    // mount (page 1, total 20 => totalPages 3 with limit 9)
    publicListBlogsMock.mockResolvedValueOnce({
      data: {
        data: [{ _id: "1", title: "A", slug: "a" }],
        meta: { total: 20, page: 1, limit: 9 },
      },
    });

    // next page fetch
    publicListBlogsMock.mockResolvedValueOnce({
      data: {
        data: [{ _id: "2", title: "B", slug: "b" }],
        meta: { total: 20, page: 2, limit: 9 },
      },
    });

    // prev page fetch
    publicListBlogsMock.mockResolvedValueOnce({
      data: {
        data: [{ _id: "1", title: "A", slug: "a" }],
        meta: { total: 20, page: 1, limit: 9 },
      },
    });

    const user = userEvent.setup();
    render(<BlogsPage />);

    // wait initial
    expect(await screen.findByText("A")).toBeInTheDocument();

    // Next -> page 2
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => {
      expect(publicListBlogsMock).toHaveBeenNthCalledWith(2, { page: 2, limit: 9, search: undefined });
    });
    expect(await screen.findByText("B")).toBeInTheDocument();

    // Prev -> page 1
    await user.click(screen.getByRole("button", { name: /prev/i }));
    await waitFor(() => {
      expect(publicListBlogsMock).toHaveBeenNthCalledWith(3, { page: 1, limit: 9, search: undefined });
    });
    expect(await screen.findByText("A")).toBeInTheDocument();
  });

  test("changing limit triggers fetch with new limit and resets page to 1", async () => {
    // mount
    publicListBlogsMock.mockResolvedValueOnce({
      data: { data: [{ _id: "1", title: "A", slug: "a" }], meta: { total: 20, page: 1, limit: 9 } },
    });

    // change limit fetch
    publicListBlogsMock.mockResolvedValueOnce({
      data: { data: [{ _id: "x", title: "X", slug: "x" }], meta: { total: 20, page: 1, limit: 12 } },
    });

    const user = userEvent.setup();
    render(<BlogsPage />);

    expect(await screen.findByText("A")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "12");
    await waitFor(() => {
      expect(publicListBlogsMock).toHaveBeenNthCalledWith(2, { page: 1, limit: 12, search: undefined });
    });

    expect(await screen.findByText("X")).toBeInTheDocument();
  });

  test("shows error message when API fails", async () => {
    publicListBlogsMock.mockRejectedValueOnce({ message: "Boom" });

    render(<BlogsPage />);

    expect(await screen.findByText(/boom/i)).toBeInTheDocument();
  });
});