import { api } from "../axios";
import { endpoints } from "../endpoints";

export async function listPublicProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  sort?: "newest" | "price_asc" | "price_desc";
}) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  if (params?.categorySlug) qs.set("categorySlug", params.categorySlug);
  if (params?.sort) qs.set("sort", params.sort);

  const url = qs.toString() ? `${endpoints.public.products}?${qs.toString()}` : endpoints.public.products;
  const res = await api.get(url);
  return res.data; // { success, data, meta }
}

export async function getPublicProductBySlug(slug: string) {
  const res = await api.get(endpoints.public.productBySlug(slug));
  return res.data;
}
