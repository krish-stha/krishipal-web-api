import { api } from "../axios";
import { endpoints } from "../endpoints";

export async function publicListBlogs(params?: { page?: number; limit?: number; search?: string }) {
  const res = await api.get(endpoints.public.blogs, { params });
  return res.data;
}

export async function publicGetBlogBySlug(slug: string) {
  const res = await api.get(endpoints.public.blogBySlug(slug));
  return res.data;
}