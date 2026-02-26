import { AdminUpdateBlogDTO } from "../../../dtos/blog.dto";

describe("AdminUpdateBlogDTO", () => {
  it("accepts empty object (all optional)", () => {
    const r = AdminUpdateBlogDTO.safeParse({});
    expect(r.success).toBe(true);
  });

  it("accepts valid fields", () => {
    const r = AdminUpdateBlogDTO.safeParse({
      title: "My Blog Title",
      slug: "my-blog",
      excerpt: "short excerpt",
      content: "content here",
      status: "draft",
    });
    expect(r.success).toBe(true);
  });

  it("rejects too short title", () => {
    const r = AdminUpdateBlogDTO.safeParse({ title: "ab" });
    expect(r.success).toBe(false);
  });

  it("rejects too short slug", () => {
    const r = AdminUpdateBlogDTO.safeParse({ slug: "aa" });
    expect(r.success).toBe(false);
  });

  it("rejects excerpt > 300 chars", () => {
    const r = AdminUpdateBlogDTO.safeParse({ excerpt: "a".repeat(301) });
    expect(r.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const r = AdminUpdateBlogDTO.safeParse({ status: "private" as any });
    expect(r.success).toBe(false);
  });

  it("trims title/slug", () => {
    const r = AdminUpdateBlogDTO.safeParse({ title: "  Hello  ", slug: "  abc  " });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.title).toBe("Hello");
      expect(r.data.slug).toBe("abc");
    }
  });
});