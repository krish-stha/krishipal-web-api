import { api } from "../axios";
import { endpoints } from "../endpoints";

export type AdminBlogStatus = "draft" | "published";

export async function adminListBlogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: AdminBlogStatus | "all";
}) {
  const res = await api.get(endpoints.admin.blogs, { params });
  return res.data;
}

export async function adminCreateBlog(fd: FormData) {
  // fd: title, slug, excerpt, content, status, cover(file)
  const res = await api.post(endpoints.admin.blogs, fd);
  return res.data;
}

export async function adminUpdateBlog(id: string, fd: FormData) {
  const res = await api.put(endpoints.admin.blogById(id), fd);
  return res.data;
}

export async function adminDeleteBlog(id: string) {
  const res = await api.delete(endpoints.admin.blogById(id));
  return res.data;
}