import request from "supertest";
import app from "../../app";
import { BlogModel } from "../../models/blog.model";

describe("Blog Controller Integration (Public)", () => {
  it("GET /api/blogs returns list", async () => {
    const res = await request(app).get("/api/blogs");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.meta).toBeDefined();
  });

  it("GET /api/blogs/:slug returns 400 if slug empty-like", async () => {
    // Express won't route empty param, so simulate invalid by sending spaces
    const res = await request(app).get("/api/blogs/%20%20%20");
    expect([400, 404]).toContain(res.status);
  });

  it("GET /api/blogs/:slug returns 404 for missing slug", async () => {
    const res = await request(app).get(`/api/blogs/does-not-exist-${Date.now()}`);
    expect(res.status).toBe(404);
  });

  it("GET /api/blogs/:slug returns 200 for existing blog", async () => {
    const slug = `blog-${Date.now()}`;

    await BlogModel.create({
      title: "Public Blog",
      slug,
      excerpt: "Hello",
      content: "World",
      coverImage: null,
      status: "published", // if your model uses different enum, adjust
      deleted_at: null,
    });

    const res = await request(app).get(`/api/blogs/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.slug).toBe(slug);
  });
});