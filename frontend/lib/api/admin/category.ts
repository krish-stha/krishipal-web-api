import { api } from "../axios";
import { endpoints } from "../endpoints";

export async function adminListCategories() {
  const res = await api.get(endpoints.admin.categories);
  return res.data; // { success, data }
}

export async function adminCreateCategory(payload: { name: string; parentId?: string | null; isActive?: boolean }) {
  const res = await api.post(endpoints.admin.categories, payload);
  return res.data;
}

export async function adminUpdateCategory(id: string, payload: any) {
  const res = await api.put(endpoints.admin.categoryById(id), payload);
  return res.data;
}

export async function adminDeleteCategory(id: string) {
  const res = await api.delete(endpoints.admin.categoryById(id));
  return res.data;
}
