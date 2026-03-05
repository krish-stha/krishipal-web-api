import request from "supertest";
import app from "../../app";
import { createAdminAndGetToken } from "../helpers/test-auth";

function uniqSlug() {
  return `blog-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

describe("Admin Blog Integration", () => {
  it("POST /api/admin/blogs requires admin", async () => {
    const res = await request(app).post("/api/admin/blogs").send({});
    expect([401, 403]).toContain(res.status);
  });

  it("CRUD blogs (admin)", async () => {
    const { token } = await createAdminAndGetToken();

    // CREATE
    const title = `Test Blog ${Date.now()}`;
    const slug = uniqSlug();

    const create = await request(app)
      .post("/api/admin/blogs")
      .set("Authorization", `Bearer ${token}`)
      .field("title", title)
      .field("slug", slug)
      .field("excerpt", "Short excerpt")
      .field("content", "Long content")
      .field("status", "published")
      .attach("cover", Buffer.from("fake-image"), {
        filename: "cover.png",
        contentType: "image/png",
      });

    expect([200, 201]).toContain(create.status);
    const createdId =
      create.body?.data?._id || create.body?._id || create.body?.data?.id || create.body?.id;
    expect(createdId).toBeTruthy();

    // LIST
    const list = await request(app)
      .get("/api/admin/blogs")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(list.status);

    // GET BY ID
    const getOne = await request(app)
      .get(`/api/admin/blogs/${createdId}`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(getOne.status);

    // UPDATE
    const upd = await request(app)
      .put(`/api/admin/blogs/${createdId}`)
      .set("Authorization", `Bearer ${token}`)
      .field("title", `${title} Updated`)
      .field("excerpt", "Updated excerpt")
      .field("status", "draft");

    expect([200, 201]).toContain(upd.status);

    // DELETE
    const del = await request(app)
      .delete(`/api/admin/blogs/${createdId}`)
      .set("Authorization", `Bearer ${token}`);

    expect([200, 201]).toContain(del.status);
  });
});